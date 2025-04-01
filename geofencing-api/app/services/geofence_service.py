from typing import List
from loguru import logger

from app.models.location import Coordinates, Building
from app.models.geofence import GeofenceStatus, GeofenceResponse
from app.utils.distance_calculator import DistanceCalculator
from app.services.osm_service import OSMService
from app.config import settings


class GeofenceService:
    """Service for geofencing operations."""
    
    def __init__(self, osm_service: OSMService) -> None:
        """
        Initialize the geofence service.
        
        Args:
            osm_service: Service for interacting with OpenStreetMap
        """
        self.osm_service = osm_service
        self.default_radius = settings.geofence.default_radius_meters
        logger.debug("Initialized GeofenceService with default radius: {} meters", self.default_radius)
    
    async def check_geofence(
        self, user_coordinates: Coordinates, radius_meters: float = None
    ) -> GeofenceResponse:
        """
        Check if the user is within the geofence of any buildings.
        
        Args:
            user_coordinates: User's geographic coordinates
            radius_meters: Radius in meters to check for nearby buildings
            
        Returns:
            GeofenceResponse with buildings within the geofence
        """
        if radius_meters is None:
            radius_meters = self.default_radius
        
        logger.info(
            "Checking geofence for coordinates ({}, {}) with radius {} meters",
            user_coordinates.latitude, user_coordinates.longitude, radius_meters
        )
        
        # Fetch nearby buildings
        nearby_buildings = await self.osm_service.get_buildings_nearby(
            user_coordinates, radius_meters=radius_meters * 1.2  # Add 20% buffer for accuracy
        )
        
        logger.debug("Found {} nearby buildings", len(nearby_buildings))
        
        # Check if the user is within the geofence of each building
        geofence_statuses = self._calculate_geofence_statuses(
            user_coordinates, nearby_buildings, radius_meters
        )
        
        # Create the response
        response = GeofenceResponse(
            user_coordinates=user_coordinates,
            radius_meters=radius_meters,
            buildings_within_geofence=geofence_statuses
        )
        
        buildings_count = len(geofence_statuses)
        within_count = sum(1 for status in geofence_statuses if status.is_within_geofence)
        
        logger.info(
            "Geofence check completed. Found {} buildings, {} within the {}m radius",
            buildings_count, within_count, radius_meters
        )
        
        return response
    
    def _calculate_geofence_statuses(
        self, user_coordinates: Coordinates, buildings: List[Building], radius_meters: float
    ) -> List[GeofenceStatus]:
        """
        Calculate geofence status for each building.
        
        Args:
            user_coordinates: User's geographic coordinates
            buildings: List of buildings to check
            radius_meters: Radius in meters to check for geofence
            
        Returns:
            List of geofence statuses for each building
        """
        geofence_statuses = []
        
        for building in buildings:
            # Calculate distance between user and building
            distance = DistanceCalculator.haversine_distance(
                user_coordinates, building.coordinates
            )
            
            # Check if user is within geofence
            is_within_geofence = distance <= radius_meters
            
            geofence_status = GeofenceStatus(
                is_within_geofence=is_within_geofence,
                distance_meters=distance,
                building=building
            )
            
            geofence_statuses.append(geofence_status)
        
        # Sort by distance (closest first)
        geofence_statuses.sort(key=lambda status: status.distance_meters)
        
        return geofence_statuses