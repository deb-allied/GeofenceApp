from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.logger import logger

# Create SQLAlchemy engine instance
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
logger.info("Database engine initialized with URI: %s", settings.SQLALCHEMY_DATABASE_URI)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
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