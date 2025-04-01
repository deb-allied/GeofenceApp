from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class Coordinates(BaseModel):
    """Geographic coordinates with latitude and longitude."""
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    
    @validator('latitude')
    def validate_latitude(cls, v: float) -> float:
        """Validate latitude is within valid range."""
        if not -90.0 <= v <= 90.0:
            raise ValueError(f"Latitude must be between -90 and 90, got {v}")
        return round(v, 6)  # Round to 6 decimal places (about 11cm precision)
    
    @validator('longitude')
    def validate_longitude(cls, v: float) -> float:
        """Validate longitude is within valid range."""
        if not -180.0 <= v <= 180.0:
            raise ValueError(f"Longitude must be between -180 and 180, got {v}")
        return round(v, 6)  # Round to 6 decimal places


class UserLocation(BaseModel):
    """User location data model."""
    user_id: Optional[str] = Field(None, description="Unique identifier for the user")
    coordinates: Coordinates
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    accuracy: Optional[float] = Field(None, description="Accuracy of location in meters")


class Building(BaseModel):
    """Building data model."""
    id: str = Field(..., description="Unique identifier for the building")
    name: Optional[str] = Field(None, description="Name of the building")
    coordinates: Coordinates
    address: Optional[str] = Field(None, description="Address of the building")
    category: Optional[str] = Field(None, description="Category of the building")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class LocationResponse(BaseModel):
    """Response model for location-based queries."""
    coordinates: Coordinates
    timestamp: datetime
    message: Optional[str] = None


class BuildingsResponse(BaseModel):
    """Response model for building queries."""
    buildings: List[Building]
    count: int = Field(..., description="Number of buildings returned")
    total_available: Optional[int] = Field(None, description="Total buildings available")