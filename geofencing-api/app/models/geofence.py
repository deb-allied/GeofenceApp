from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.models.location import Coordinates, Building


class GeofenceRequest(BaseModel):
    """Request model for geofence check."""
    user_location: Coordinates
    radius_meters: Optional[float] = Field(
        None, 
        description="Radius in meters to check for nearby buildings"
    )


class GeofenceStatus(BaseModel):
    """Status of a user in relation to a geofence."""
    is_within_geofence: bool = Field(
        ..., 
        description="Whether the user is within the geofence"
    )
    distance_meters: float = Field(
        ..., 
        description="Distance in meters from the user to the building"
    )
    building: Building
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class GeofenceResponse(BaseModel):
    """Response model for geofence queries."""
    user_coordinates: Coordinates
    radius_meters: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    buildings_within_geofence: List[GeofenceStatus]
    
    @property
    def is_near_any_building(self) -> bool:
        """Determine if the user is near any building."""
        return any(status.is_within_geofence for status in self.buildings_within_geofence)
    
    @property
    def nearest_building(self) -> Optional[GeofenceStatus]:
        """Get the nearest building to the user."""
        if not self.buildings_within_geofence:
            return None
        return min(
            self.buildings_within_geofence, 
            key=lambda status: status.distance_meters
        )