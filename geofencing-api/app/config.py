import os
from pydantic import BaseModel, Field
from loguru import logger
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from .env file
load_dotenv()

class APIConfig(BaseModel):
    """API configuration settings."""
    title: str = "Geofencing API"
    description: str = "API for geofencing users based on proximity to buildings"
    version: str = "0.1.0"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"


class GeofenceConfig(BaseModel):
    """Geofencing specific configuration."""
    default_radius_meters: float = Field(
        default=100.0, 
        description="Default radius in meters for geofencing"
    )
    max_buildings_return: int = Field(
        default=50, 
        description="Maximum number of buildings to return in a single request"
    )


class OSMConfig(BaseModel):
    """OpenStreetMap API configuration."""
    base_url: str = "https://nominatim.openstreetmap.org"
    user_agent: str = "GeofencingAPI/0.1.0"
    timeout_seconds: int = 5


class DatabaseConfig(BaseModel):
    """Database configuration if needed in the future."""
    url: Optional[str] = None
    max_connections: int = 10


class Settings(BaseModel):
    """Main application settings."""
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    api: APIConfig = APIConfig()
    geofence: GeofenceConfig = GeofenceConfig()
    osm: OSMConfig = OSMConfig()
    database: DatabaseConfig = DatabaseConfig()


# Create global settings object
settings = Settings()

logger.debug("Loaded application settings: environment={}", settings.environment)