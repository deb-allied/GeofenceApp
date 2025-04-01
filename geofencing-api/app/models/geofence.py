from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

from app.models.location import Coordinates
from app.models.building import PredefinedBuilding


class GeofenceRequest(BaseModel):
    """Request model for geofence check."""
    user_location: Coordinates
    

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
    building: PredefinedBuilding = Field(
        ...,
        description="The building being checked for geofence"
    )
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