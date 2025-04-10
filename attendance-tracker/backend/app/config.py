import os
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, PostgresDsn, validator
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings configuration."""
    
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Attendance Tracker"
    
    # SECURITY
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-development")  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # DATABASE
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "%40HelloPostGres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "attendance_tracker")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        """Build the database URI from components."""
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # GEOFENCE SETTINGS
    GEOFENCE_RADIUS_METERS: int = 100  # Default radius for geofence in meters
    
    class Config:
        case_sensitive = True


settings = Settings()