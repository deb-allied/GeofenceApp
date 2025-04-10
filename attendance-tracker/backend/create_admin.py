import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.models.models import User
from app.core.auth import get_password_hash
from app.logger import logger

def create_admin_user(username, email, password):
    """Create an admin user."""
    db = SessionLocal()
    try:
        # Check if user already exists
        user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if user:
            logger.warning(f"User with email {email} or username {username} already exists")
            return
        
        # Create admin user
        admin_user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            full_name="Admin User",
            is_active=True,
            is_admin=True,
        )
        
        db.add(admin_user)
        db.commit()
        logger.info(f"Admin user created: {username}")
    finally:
        db.close()

if __name__ == "__main__":
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    
    create_admin_user(username, email, password)