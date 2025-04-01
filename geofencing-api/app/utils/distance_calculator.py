import math
from loguru import logger
from app.models.location import Coordinates


class DistanceCalculator:
    """Utility class for calculating distances between geographic coordinates."""
    
    # Earth radius in meters
    EARTH_RADIUS_METERS = 6371000
    
    @classmethod
    def haversine_distance(cls, point1: Coordinates, point2: Coordinates) -> float:
        """
        Calculate the great-circle distance between two points on the Earth's surface.
        
        Uses the Haversine formula for calculating distances on a sphere.
        Time complexity: O(1)
        
        Args:
            point1: First geographic coordinate
            point2: Second geographic coordinate
            
        Returns:
            Distance between the points in meters
        """
        # Convert latitude and longitude from degrees to radians
        lat1_rad = math.radians(point1.latitude)
        lon1_rad = math.radians(point1.longitude)
        lat2_rad = math.radians(point2.latitude)
        lon2_rad = math.radians(point2.longitude)
        
        # Haversine formula
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        
        a = (
            math.sin(dlat / 2) ** 2 + 
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        # Distance in meters
        distance = cls.EARTH_RADIUS_METERS * c
        
        logger.debug(
            "Calculated distance between coordinates: ({}, {}) and ({}, {}) = {} meters",
            point1.latitude, point1.longitude, 
            point2.latitude, point2.longitude,
            round(distance, 2)
        )
        
        return distance
    
    @classmethod
    def is_within_radius(
        cls, point1: Coordinates, point2: Coordinates, radius_meters: float
    ) -> bool:
        """
        Check if two points are within a specific radius of each other.
        
        Args:
            point1: First geographic coordinate
            point2: Second geographic coordinate
            radius_meters: Radius in meters
            
        Returns:
            True if the points are within the specified radius, False otherwise
        """
        distance = cls.haversine_distance(point1, point2)
        is_within = distance <= radius_meters
        
        logger.debug(
            "Checking if within radius: distance={} m, radius={} m, result={}",
            round(distance, 2), radius_meters, is_within
        )
        
        return is_within