from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import settings
from app.core.auth import (
    create_access_token,
    get_current_active_user,
    get_password_hash,
    verify_password,
)
from app.db.base import get_db
from app.logger import logger
from app.models.models import User
from app.schemas.schemas import Token, User as UserSchema, UserCreate

router = APIRouter()


@router.post("/register", response_model=UserSchema)
def register_user(*, db: Session = Depends(get_db), user_in: UserCreate) -> Any:
    """Register a new user.
    
    Args:
        db: Database session
        user_in: User creation data
    
    Returns:
        Created user
    
    Raises:
        HTTPException: If user already exists
    """
    # Check if user already exists
    user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    
    if user:
        logger.warning(
            "Registration failed: User with email %s or username %s already exists",
            user_in.email, user_in.username
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered",
        )

    # Create new user
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        is_admin=False,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    logger.info("User registered successfully: %s", db_user.username)
    return db_user


@router.post("/login", response_model=Token)
def login_for_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """Login and get access token.
    
    Args:
        db: Database session
        form_data: Login form data
    
    Returns:
        Access token
    
    Raises:
        HTTPException: If authentication fails
    """
    # Check if user exists
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt for username: %s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        logger.warning("Login attempt by inactive user: %s", user.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    logger.info("User logged in successfully: %s", user.username)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_active_user)) -> Any:
    """Get current user information.
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Current user data
    """
    return current_user