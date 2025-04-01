import httpx
from typing import Dict, Any, List, Optional
from loguru import logger
import math

from app.config import settings
from app.models.location import Coordinates, Building
from app.utils.distance_calculator import DistanceCalculator


class OSMService:
    """Service for interacting with OpenStreetMap API."""
    
    def __init__(self) -> None:
        """Initialize the OSM service with configuration."""
        self.base_url = settings.osm.base_url
        self.user_agent = settings.osm.user_agent
        self.timeout = settings.osm.timeout_seconds
        self.overpass_url = "https://overpass-api.de/api/interpreter"
        logger.debug("Initialized OSM service with base URL: {}", self.base_url)
    
    async def get_buildings_nearby(
        self, coordinates: Coordinates, radius_meters: float = 100, limit: int = 10
    ) -> List[Building]:
        """
        Find buildings near the specified coordinates using Overpass API.
        
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
        
        # Use Overpass API to query buildings within the exact radius
        # This provides much more precise spatial filtering than Nominatim
        overpass_query = f"""
        [out:json];
        (
          way["building"](around:{radius_meters},{coordinates.latitude},{coordinates.longitude});
          relation["building"](around:{radius_meters},{coordinates.latitude},{coordinates.longitude});
        );
        out center {limit};
        """
        
        headers = {
            "User-Agent": self.user_agent,
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.overpass_url,
                    content=overpass_query,
                    headers=headers,
                    timeout=self.timeout
                )
                response.raise_for_status()
                results = response.json()
                
                buildings = []
                elements = results.get("elements", [])
                
                logger.debug("Received {} buildings from Overpass API", len(elements))
                
                # Process each building and verify it's within our radius
                for element in elements[:limit]:
                    # For ways/relations, Overpass returns a center point
                    lat = element.get("center", {}).get("lat") or element.get("lat")
                    lon = element.get("center", {}).get("lon") or element.get("lon")
                    
                    if lat is None or lon is None:
                        continue
                    
                    building_coordinates = Coordinates(latitude=float(lat), longitude=float(lon))
                    
                    # Double-check the distance to ensure it's within our radius
                    distance = DistanceCalculator.haversine_distance(
                        coordinates, building_coordinates
                    )
                    
                    if distance <= radius_meters:
                        building = self._parse_overpass_building(element, building_coordinates)
                        buildings.append(building)
                
                logger.info("Found {} buildings within {}m radius", len(buildings), radius_meters)
                return buildings
                
        except httpx.RequestError as e:
            logger.error("Error fetching buildings from Overpass API: {}", e)
            # Fallback to Nominatim with tighter filtering if Overpass fails
            return await self._fallback_get_buildings_nearby(coordinates, radius_meters, limit)
    
    async def _fallback_get_buildings_nearby(
        self, coordinates: Coordinates, radius_meters: float, limit: int
    ) -> List[Building]:
        """
        Fallback method to find buildings using Nominatim if Overpass fails.
        
        Args:
            coordinates: The center coordinates to search around
            radius_meters: Search radius in meters
            limit: Maximum number of buildings to return
            
        Returns:
            List of buildings near the specified coordinates
        """
        logger.info("Using fallback Nominatim method to search for buildings")
        
        # Use a bounding box approach instead of radius
        # Calculate a bounding box around the center point
        # ~111,000 meters per degree of latitude, and ~111,000*cos(lat) meters per degree of longitude
        lat_offset = radius_meters / 111000
        lon_offset = radius_meters / (111000 * math.cos(math.radians(coordinates.latitude)))
        
        bbox = [
            coordinates.longitude - lon_offset,  # min lon
            coordinates.latitude - lat_offset,   # min lat
            coordinates.longitude + lon_offset,  # max lon
            coordinates.latitude + lat_offset    # max lat
        ]
        
        params = {
            "format": "json",
            "limit": min(limit * 3, settings.geofence.max_buildings_return),  # Request more to filter later
            "bbox": ",".join(map(str, bbox)),
            "building": "yes"
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
                
                logger.debug("Received {} results from Nominatim API", len(results))
                
                # Filter results to ensure they are within our radius
                buildings = []
                for item in results:
                    if len(buildings) >= limit:
                        break
                        
                    building_coordinates = Coordinates(
                        latitude=float(item.get("lat")),
                        longitude=float(item.get("lon"))
                    )
                    
                    # Calculate actual distance
                    distance = DistanceCalculator.haversine_distance(
                        coordinates, building_coordinates
                    )
                    
                    if distance <= radius_meters:
                        building = self._parse_building(item)
                        buildings.append(building)
                
                logger.info("Filtered to {} buildings within {}m radius", len(buildings), radius_meters)
                return buildings
                
        except httpx.RequestError as e:
            logger.error("Error in fallback building search from Nominatim: {}", e)
            return []
    
    def _parse_overpass_building(self, element: Dict[str, Any], coordinates: Coordinates) -> Building:
        """
        Parse Overpass API response item into a Building model.
        
        Args:
            element: Overpass API response item
            coordinates: The coordinates of the building
            
        Returns:
            Building model
        """
        tags = element.get("tags", {})
        element_id = f"{element.get('type')}/{element.get('id')}"
        
        return Building(
            id=element_id,
            name=tags.get("name") or tags.get("building:name") or "Unnamed building",
            coordinates=coordinates,
            address=tags.get("addr:street", "") + " " + tags.get("addr:housenumber", ""),
            category=tags.get("building") or "building",
            metadata=tags
        )
    
    def _parse_building(self, item: Dict[str, Any]) -> Building:
        """
        Parse Nominatim API response item into a Building model.
        
        Args:
            item: Nominatim API response item
            
        Returns:
            Building model
        """
        return Building(
            id=str(item.get("osm_id", "")),
            name=item.get("name") or "Unnamed building",
            coordinates=Coordinates(
                latitude=float(item.get("lat")),
                longitude=float(item.get("lon"))
            ),
            address=item.get("display_name", ""),
            category=item.get("type") or "building",
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