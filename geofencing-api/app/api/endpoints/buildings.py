from fastapi import APIRouter, HTTPException, status
from typing import List
from loguru import logger

from app.models.building import (
    PredefinedBuilding, 
    BuildingCreate, 
    BuildingUpdate, 
    BuildingResponse,
    BuildingsListResponse
)
from app.services.building_storage import building_storage

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("", response_model=BuildingsListResponse)
async def get_buildings() -> BuildingsListResponse:
    """
    Get all predefined buildings.
    
    Returns:
        List of buildings
    """
    buildings = building_storage.get_all_buildings()
    
    logger.info("Retrieved {} buildings", len(buildings))
    
    return BuildingsListResponse(
        buildings=buildings,
        count=len(buildings)
    )


@router.get("/{building_id}", response_model=BuildingResponse)
async def get_building(building_id: str) -> BuildingResponse:
    """
    Get a specific building by ID.
    
    Args:
        building_id: ID of the building to get
        
    Returns:
        Building if found
        
    Raises:
        404: If the building is not found
    """
    building = building_storage.get_building(building_id)
    
    if not building:
        logger.warning("Building with ID {} not found", building_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with ID {building_id} not found"
        )
    
    logger.info("Retrieved building {}: {}", building_id, building.name)
    
    return BuildingResponse(building=building)


@router.post("", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
async def create_building(building_data: BuildingCreate) -> BuildingResponse:
    """
    Create a new building.
    
    Args:
        building_data: Data for the new building
        
    Returns:
        Created building
    """
    building = building_storage.create_building(building_data)
    
    logger.info(
        "Created building {}: {}, at ({}, {}), radius {}m",
        building.id,
        building.name,
        building.coordinates.latitude,
        building.coordinates.longitude,
        building.geofence_radius_meters
    )
    
    return BuildingResponse(building=building)


@router.put("/{building_id}", response_model=BuildingResponse)
async def update_building(building_id: str, building_data: BuildingUpdate) -> BuildingResponse:
    """
    Update an existing building.
    
    Args:
        building_id: ID of the building to update
        building_data: New data for the building
        
    Returns:
        Updated building
        
    Raises:
        404: If the building is not found
    """
    building = building_storage.update_building(building_id, building_data)
    
    if not building:
        logger.warning("Building with ID {} not found for update", building_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with ID {building_id} not found"
        )
    
    logger.info(
        "Updated building {}: {}, at ({}, {}), radius {}m",
        building.id,
        building.name,
        building.coordinates.latitude,
        building.coordinates.longitude,
        building.geofence_radius_meters
    )
    
    return BuildingResponse(building=building)


@router.delete("/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_building(building_id: str) -> None:
    """
    Delete a building.
    
    Args:
        building_id: ID of the building to delete
        
    Raises:
        404: If the building is not found
    """
    deleted = building_storage.delete_building(building_id)
    
    if not deleted:
        logger.warning("Building with ID {} not found for deletion", building_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Building with ID {building_id} not found"
        )
    
    logger.info("Deleted building {}", building_id)