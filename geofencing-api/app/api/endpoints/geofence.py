from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from loguru import logger

from app.models.geofence import GeofenceRequest, GeofenceResponse
from app.services.geofence_service import GeofenceService
from app.services.osm_service import OSMService

router = APIRouter(prefix="/geofence", tags=["geofence"])


def get_osm_service() -> OSMService:
    """Dependency to get the OSM service."""
    return OSMService()


def get_geofence_service(osm_service: OSMService = Depends(get_osm_service)) -> GeofenceService:
    """Dependency to get the geofence service."""
    return GeofenceService(osm_service)


@router.post("/check", response_model=GeofenceResponse)
async def check_geofence(
    request: GeofenceRequest,
    geofence_service: GeofenceService = Depends(get_geofence_service)
) -> GeofenceResponse:
    """
    Check if the user is within the geofence of any buildings.
    
    Args:
        request: Geofence check request containing user coordinates and optional radius
        geofence_service: Service for geofencing operations
    
    Returns:
        GeofenceResponse with buildings within the geofence
    """
    logger.info(
        "Received geofence check request for coordinates ({}, {}), radius={}",
        request.user_location.latitude, 
        request.user_location.longitude,
        request.radius_meters
    )
    
    try:
        response = await geofence_service.check_geofence(
            request.user_location,
            radius_meters=request.radius_meters
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