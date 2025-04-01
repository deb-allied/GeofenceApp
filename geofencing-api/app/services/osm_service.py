import httpx
from typing import Dict, Any, List, Optional
from loguru import logger

from app.config import settings
from app.models.location import Coordinates, Building


class OSMService:
    """Service for interacting with OpenStreetMap API."""
    
    def __init__(self) -> None:
        """Initialize the OSM service with configuration."""
        self.base_url = settings.osm.base_url
        self.user_agent = settings.osm.user_agent
        self.timeout = settings.osm.timeout_seconds
        logger.debug("Initialized OSM service with base URL: {}", self.base_url)
    
    async def get_buildings_nearby(
        self, coordinates: Coordinates, radius_meters: float = 100, limit: int = 10
    ) -> List[Building]:
        """
        Find buildings near the specified coordinates.
        
        Args:
            coordinates: The center coordinates to search around
            radius_meters: Search radius in meters
            limit: Maximum number of buildings to return
            
        Returns:
            List of buildings near the specified coordinates
        """
        logger.info(
            "Searching for buildings near ({}, {}) within {} meters, limit={}",
            coordinates.latitude, coordinates.longitude, radius_meters, limit
        )
        
        # Convert radius from meters to degrees (approximate)
        # 1 degree of latitude ≈ 111,000 meters
        radius_degrees = radius_meters / 111000
        
        params = {
            "format": "json",
            "limit": min(limit, settings.geofence.max_buildings_return),
            "lat": coordinates.latitude,
            "lon": coordinates.longitude,
            "radius": radius_degrees,
            # Filter to include only buildings
            "amenity": "building",
            "building": "yes",
        }
        
        headers = {
            "User-Agent": self.user_agent
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params=params,
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                results = response.json()
                
                logger.debug("Received {} buildings from OSM API", len(results))
                
                buildings = [self._parse_building(item) for item in results]
                return buildings
                
        except httpx.RequestError as e:
            logger.error("Error fetching buildings from OSM: {}", e)
            raise
    
    def _parse_building(self, item: Dict[str, Any]) -> Building:
        """
        Parse OSM API response item into a Building model.
        
        Args:
            item: OSM API response item
            
        Returns:
            Building model
        """
        return Building(
            id=str(item.get("osm_id", "")),
            name=item.get("name"),
            coordinates=Coordinates(
                latitude=float(item.get("lat")),
                longitude=float(item.get("lon"))
            ),
            address=item.get("display_name"),
            category=item.get("type"),
            metadata={
                key: value for key, value in item.items()
                if key not in ["osm_id", "name", "lat", "lon", "display_name", "type"]
            }
        )
    
    async def reverse_geocode(self, coordinates: Coordinates) -> Optional[Dict[str, Any]]:
        """
        Perform reverse geocoding to get location information from coordinates.
        
        Args:
            coordinates: Geographic coordinates
            
        Returns:
            Location information if found, None otherwise
        """
        logger.info(
            "Performing reverse geocoding for coordinates ({}, {})",
            coordinates.latitude, coordinates.longitude
        )
        
        params = {
            "format": "json",
            "lat": coordinates.latitude,
            "lon": coordinates.longitude,
            "zoom": 18,  # Building level detail
            "addressdetails": 1
        }
        
        headers = {
            "User-Agent": self.user_agent
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reverse",
                    params=params,
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.json()
                
        except httpx.RequestError as e:
            logger.error("Error performing reverse geocoding: {}", e)
            return None