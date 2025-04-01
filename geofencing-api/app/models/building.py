from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List

from app.models.location import Coordinates


class PredefinedBuilding(BaseModel):
    """Model for a predefined building with geofence."""
    id: str = Field(..., description="Unique identifier for the building")
    name: str = Field(..., description="Name of the building")
    coordinates: Coordinates = Field(..., description="Geographic coordinates of the building")
    address: Optional[str] = Field(None, description="Address of the building")
    category: Optional[str] = Field(None, description="Category of the building (e.g., office, school)")
    geofence_radius_meters: float = Field(
        100.0, 
        description="Radius of the geofence around this building in meters",
        ge=1.0,
        le=1000.0
    )
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    @validator('geofence_radius_meters')
    def validate_radius(cls, v: float) -> float:
        """Validate that the geofence radius is within reasonable limits."""
        if v < 1.0:
            raise ValueError("Geofence radius must be at least 1 meter")
        if v > 1000.0:
            raise ValueError("Geofence radius must not exceed 1000 meters")
        return v


class BuildingCreate(BaseModel):
    """Model for creating a new predefined building."""
    name: str = Field(..., description="Name of the building")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude of the building")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude of the building")
    address: Optional[str] = Field(None, description="Address of the building")
    category: Optional[str] = Field(None, description="Category of the building")
    geofence_radius_meters: float = Field(
        100.0, 
        description="Radius of the geofence around this building in meters"
    )
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class BuildingUpdate(BaseModel):
    """Model for updating an existing predefined building."""
    name: Optional[str] = Field(None, description="Name of the building")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude of the building")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude of the building")
    address: Optional[str] = Field(None, description="Address of the building")
    category: Optional[str] = Field(None, description="Category of the building")
    geofence_radius_meters: Optional[float] = Field(
        None, 
        description="Radius of the geofence around this building in meters"
    )
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class BuildingResponse(BaseModel):
    """Response model for building operations."""
    building: PredefinedBuilding


class BuildingsListResponse(BaseModel):
    """Response model for listing buildings."""
    buildings: List[PredefinedBuilding]
    count: int = Field(..., description="Number of buildings returned")