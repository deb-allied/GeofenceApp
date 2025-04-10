import uuid
from typing import Dict, List, Optional
from loguru import logger

from app.models.location import Coordinates
from app.models.building import PredefinedBuilding, BuildingCreate, BuildingUpdate


class BuildingStorage:
    """Service for storing and retrieving predefined buildings."""
    
    def __init__(self) -> None:
        """Initialize the building storage with an empty dictionary."""
        # In-memory storage for buildings
        # In a production environment, this would be replaced with a database
        self._buildings: Dict[str, PredefinedBuilding] = {}
        logger.info("BuildingStorage initialized")
        
        # Add some example buildings if storage is empty
        if not self._buildings:
            self._add_example_buildings()
    
    def _add_example_buildings(self) -> None:
        """Add example buildings to the storage for testing purposes."""
        example_buildings = [
            BuildingCreate(
                name="Company Headquarters",
                latitude=40.7128,
                longitude=-74.0060,
                address="123 Business St, New York, NY",
                category="office",
                geofence_radius_meters=100.0
            ),
            BuildingCreate(
                name="Shopping Mall",
                latitude=40.7580,
                longitude=-73.9855,
                address="456 Retail Ave, New York, NY",
                category="commercial",
                geofence_radius_meters=150.0
            ),
            BuildingCreate(
                name="Allied Worldwide Bengaluru",
                latitude=12.967549,
                longitude=77.603994,
                address="First Floor, Le Parc Richmonde",
                category="Office",
                geofence_radius_meters=200.0
            )
        ]
        
        for building_data in example_buildings:
            self.create_building(building_data)
        
        logger.info("Added {} example buildings to storage", len(example_buildings))
    
    def get_all_buildings(self) -> List[PredefinedBuilding]:
        """
        Get all buildings in the storage.
        
        Returns:
            List of all buildings
        """
        return list(self._buildings.values())
    
    def get_building(self, building_id: str) -> Optional[PredefinedBuilding]:
        """
        Get a building by its ID.
        
        Args:
            building_id: ID of the building to get
            
        Returns:
            Building if found, None otherwise
        """
        return self._buildings.get(building_id)
    
    def create_building(self, building_data: BuildingCreate) -> PredefinedBuilding:
        """
        Create a new building.
        
        Args:
            building_data: Data for the new building
            
        Returns:
            The created building
        """
        # Generate a unique ID for the building
        building_id = str(uuid.uuid4())
        
        # Create the building with the provided data
        building = PredefinedBuilding(
            id=building_id,
            name=building_data.name,
            coordinates=Coordinates(
                latitude=building_data.latitude,
                longitude=building_data.longitude
            ),
            address=building_data.address,
            category=building_data.category,
            geofence_radius_meters=building_data.geofence_radius_meters,
            metadata=building_data.metadata or {}
        )
        
        # Store the building
        self._buildings[building_id] = building
        
        logger.info(
            "Created building '{}' with ID {}, coordinates ({}, {}), radius {}m",
            building.name,
            building.id,
            building.coordinates.latitude,
            building.coordinates.longitude,
            building.geofence_radius_meters
        )
        
        return building
    
    def update_building(self, building_id: str, building_data: BuildingUpdate) -> Optional[PredefinedBuilding]:
        """
        Update an existing building.
        
        Args:
            building_id: ID of the building to update
            building_data: New data for the building
            
        Returns:
            Updated building if found, None otherwise
        """
        # Check if the building exists
        building = self._buildings.get(building_id)
        if not building:
            logger.warning("Attempted to update non-existent building with ID {}", building_id)
            return None
        
        # Update the building data
        update_data = building_data.dict(exclude_unset=True)
        
        # Special handling for coordinates
        if "latitude" in update_data or "longitude" in update_data:
            current_lat = building.coordinates.latitude
            current_lon = building.coordinates.longitude
            
            new_lat = update_data.pop("latitude", current_lat)
            new_lon = update_data.pop("longitude", current_lon)
            
            building.coordinates = Coordinates(latitude=new_lat, longitude=new_lon)
        
        # Update other fields
        for field, value in update_data.items():
            setattr(building, field, value)
        
        logger.info(
            "Updated building '{}' with ID {}, new coordinates ({}, {}), radius {}m",
            building.name,
            building.id,
            building.coordinates.latitude,
            building.coordinates.longitude,
            building.geofence_radius_meters
        )
        
        return building
    
    def delete_building(self, building_id: str) -> bool:
        """
        Delete a building.
        
        Args:
            building_id: ID of the building to delete
            
        Returns:
            True if the building was deleted, False otherwise
        """
        if building_id in self._buildings:
            building = self._buildings[building_id]
            del self._buildings[building_id]
            
            logger.info(
                "Deleted building '{}' with ID {}",
                building.name,
                building.id
            )
            
            return True
            
        logger.warning("Attempted to delete non-existent building with ID {}", building_id)
        return False


# Create a singleton instance
building_storage = BuildingStorage()

# Make sure the instance is exported at the module level
__all__ = ['BuildingStorage', 'building_storage']