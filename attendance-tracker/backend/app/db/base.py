from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base
from app.config import settings
from app.logger import logger

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    connect_args={"fast_executemany": True},
    pool_pre_ping=True,
)

SessionLocal = scoped_session(sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
))

Base = declarative_base()

def get_db():
    db = SessionLocal()
    logger.debug("Sync DB session created")
    try:
        yield db
    finally:
        db.close()
        logger.debug("Sync DB session closed")
