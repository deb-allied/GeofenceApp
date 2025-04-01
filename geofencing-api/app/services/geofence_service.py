from typing import List, Optional
from loguru import logger

from app.models.location import Coordinates
from app.models.geofence import GeofenceStatus, GeofenceResponse
from app.utils.distance_calculator import DistanceCalculator
from app.services.building_storage import building_storage
from app.models.building import PredefinedBuilding


class GeofenceService:
    """Service for geofencing operations with predefined buildings."""
    
    def __init__(self) -> None:
        """Initialize the geofence service."""
        logger.debug("Initialized GeofenceService")
    
    async def check_geofence(
        self, user_coordinates: Coordinates, building_id: Optional[str] = None
    ) -> GeofenceResponse:
        """
        Check if the user is within the geofence of predefined buildings.
        
        Args:
            user_coordinates: User's geographic coordinates
            building_id: Optional ID of a specific building to check, if None checks all buildings
            
        Returns:
            GeofenceResponse with buildings and whether user is within their geofences
        """
        logger.info(
            "Checking geofence for coordinates ({}, {}), specific building ID: {}",
            user_coordinates.latitude, user_coordinates.longitude, building_id
        )
        
        # Get buildings to check
        buildings_to_check = []
        if building_id:
            # Check only the specified building
            building = building_storage.get_building(building_id)
            if building:
                buildings_to_check.append(building)
            else:
                logger.warning("Building with ID {} not found", building_id)
        else:
            # Check all buildings
            buildings_to_check = building_storage.get_all_buildings()
        
        logger.debug("Checking geofence against {} buildings", len(buildings_to_check))
        
        # Calculate geofence statuses
        geofence_statuses = self._calculate_geofence_statuses(
            user_coordinates, buildings_to_check
        )
        
        # Determine the radius for the response (use max radius from checked buildings)
        radius_meters = 100.0  # Default
        if buildings_to_check:
            radius_meters = max(building.geofence_radius_meters for building in buildings_to_check)
        
        # Create the response
        response = GeofenceResponse(
            user_coordinates=user_coordinates,
            radius_meters=radius_meters,
            buildings_within_geofence=geofence_statuses
        )
        
        buildings_count = len(geofence_statuses)
        within_count = sum(1 for status in geofence_statuses if status.is_within_geofence)
        
        logger.info(
            "Geofence check completed. User is within {} of {} building geofences",
            within_count, buildings_count
        )
        
        return response
    
    def _calculate_geofence_statuses(
        self, user_coordinates: Coordinates, buildings: List[PredefinedBuilding]
    ) -> List[GeofenceStatus]:
        """
        Calculate geofence status for each building.
        
        Args:
            user_coordinates: User's geographic coordinates
            buildings: List of buildings to check
            
        Returns:
            List of geofence statuses for each building
        """
        geofence_statuses = []
        
        for building in buildings:
            # Calculate distance between user and building
            distance = DistanceCalculator.haversine_distance(
                user_coordinates, building.coordinates
            )
            
            # Check if user is within geofence (each building has its own radius)
            is_within_geofence = distance <= building.geofence_radius_meters
            
            logger.debug(
                "Building {}: distance={}m, radius={}m, within geofence={}",
                building.id, round(distance, 2), building.geofence_radius_meters, is_within_geofence
            )
            
            # Create geofence status with PredefinedBuilding model
            # We'll convert it to fit the existing GeofenceStatus model
            geofence_status = GeofenceStatus(
                is_within_geofence=is_within_geofence,
                distance_meters=distance,
                building=building
            )
            
            geofence_statuses.append(geofence_status)
        
        # Sort by distance (closest first)
        geofence_statuses.sort(key=lambda status: status.distance_meters)
        
        return geofence_statuses