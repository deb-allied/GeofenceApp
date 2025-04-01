from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from loguru import logger

from app.models.geofence import GeofenceRequest, GeofenceResponse
from app.services.geofence_service import GeofenceService

router = APIRouter(prefix="/geofence", tags=["geofence"])


def get_geofence_service() -> GeofenceService:
    """Dependency to get the geofence service."""
    return GeofenceService()


@router.post("/check", response_model=GeofenceResponse)
async def check_geofence(
    request: GeofenceRequest,
    building_id: Optional[str] = Query(None, description="ID of specific building to check"),
    geofence_service: GeofenceService = Depends(get_geofence_service)
) -> GeofenceResponse:
    """
    Check if the user is within the geofence of predefined buildings.
    
    Args:
        request: Geofence check request containing user coordinates
        building_id: Optional ID of a specific building to check
        geofence_service: Service for geofencing operations
    
    Returns:
        GeofenceResponse with buildings within the geofence
    """
    logger.info(
        "Received geofence check request for coordinates ({}, {}), building_id={}",
        request.user_location.latitude, 
        request.user_location.longitude,
        building_id
    )
    
    try:
        response = await geofence_service.check_geofence(
            request.user_location,
            building_id=building_id
        )
        
        within_count = sum(1 for status in response.buildings_within_geofence if status.is_within_geofence)
        logger.info(
            "Completed geofence check. User is within {} buildings' geofence",
            within_count
        )
        
        return response
        
    except Exception as e:
        logger.error("Error checking geofence: {}", e)
        raise HTTPException(status_code=500, detail=f"Error checking geofence: {str(e)}")