from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.logger import logger

# MSSQL-specific: create engine with fast_executemany for performance
# connect_args = {"fast_executemany": True}

# Initialize SQLAlchemy engine for MSSQL
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    # connect_args=connect_args,
    # pool_pre_ping=True,
)

logger.info("Database engine initialized with URI: %s", settings.SQLALCHEMY_DATABASE_URI)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class
Base = declarative_base()


def get_db():
    """Dependency for getting DB session.
    
    Yields:
        Session: Database session
    """
    db = SessionLocal()
    logger.debug("DB session created")
    try:
        yield db
    finally:
        db.close()
        logger.debug("DB session closed")
