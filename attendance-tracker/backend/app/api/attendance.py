from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.geofence import GeofenceService
from app.db.base import get_db
from app.logger import logger
from app.models.models import AttendanceRecord, Office, User
from app.schemas.schemas import (
    AttendanceRecord as AttendanceRecordSchema,
    CheckInCreate,
    CheckOutCreate,
    GeofenceStatus,
    LocationCheck,
)

router = APIRouter()


@router.post("/check-location", response_model=List[GeofenceStatus])
def check_location(
    *,
    db: Session = Depends(get_db),
    location_data: LocationCheck,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Check if a location is within any geofence.
    
    Args:
        db: Database session
        location_data: Location data to check
        current_user: Current authenticated user
    
    Returns:
        List of geofence status for all offices or specific office
    """
    # If office_id is provided, check against that specific office
    if location_data.office_id:
        office = db.query(Office).filter(Office.id == location_data.office_id).first()
        
        if not office:
            logger.warning("Office not found for location check: ID %d", location_data.office_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Office not found"
            )
            
        status = GeofenceService.check_within_geofence(
            location_data.latitude, location_data.longitude, office
        )
        
        return [status]
    
    # Otherwise, check against all offices
    results = GeofenceService.check_all_geofences(
        db, location_data.latitude, location_data.longitude
    )
    
    logger.info(
        "Location check for user %s at (%f, %f): %d offices checked",
        current_user.username, location_data.latitude, location_data.longitude, len(results)
    )
    
    return results


@router.post("/check-in", response_model=AttendanceRecordSchema)
def check_in(
    *,
    db: Session = Depends(get_db),
    check_in_data: CheckInCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Check in to an office.
    
    Args:
        db: Database session
        check_in_data: Check-in data
        current_user: Current authenticated user
    
    Returns:
        Created attendance record
    
    Raises:
        HTTPException: If office not found or user not within geofence
    """
    # Check if the office exists
    office = db.query(Office).filter(Office.id == check_in_data.office_id).first()
    
    if not office:
        logger.warning("Office not found for check-in: ID %d", check_in_data.office_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Office not found"
        )
    
    # Check if user is already checked in
    active_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.check_out_time.is_(None)
    ).first()
    
    if active_record:
        logger.warning(
            "User %s attempted check-in while already checked in (Record ID: %d)",
            current_user.username, active_record.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already checked in. Please check out first.",
        )
    
    # Verify that the user is within the geofence
    geofence_status = GeofenceService.check_within_geofence(
        check_in_data.latitude, check_in_data.longitude, office
    )
    
    if not geofence_status.is_within_geofence:
        logger.warning(
            "User %s attempted check-in outside geofence: %f meters from office %s",
            current_user.username, geofence_status.distance, office.name
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You are not within the geofence of the office. "
                  f"You are {geofence_status.distance:.2f} meters away.",
        )
    
    # Create attendance record
    attendance_record = AttendanceRecord(
        user_id=current_user.id,
        office_id=office.id,
        check_in_time=datetime.utcnow(),
        check_in_latitude=check_in_data.latitude,
        check_in_longitude=check_in_data.longitude,
    )
    
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)
    
    logger.info(
        "User %s checked in at office %s (Record ID: %d)",
        current_user.username, office.name, attendance_record.id
    )
    
    return attendance_record


@router.post("/check-out", response_model=AttendanceRecordSchema)
def check_out(
    *,
    db: Session = Depends(get_db),
    check_out_data: CheckOutCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Check out from an office.
    
    Args:
        db: Database session
        check_out_data: Check-out data
        current_user: Current authenticated user
    
    Returns:
        Updated attendance record
    
    Raises:
        HTTPException: If no active check-in found
    """
    # Find active attendance record
    attendance_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.check_out_time.is_(None)
    ).first()
    
    if not attendance_record:
        logger.warning("User %s attempted check-out without active check-in", current_user.username)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active check-in found. Please check in first.",
        )
    
    # Update the record with check-out data
    attendance_record.check_out_time = datetime.utcnow()
    attendance_record.check_out_latitude = check_out_data.latitude
    attendance_record.check_out_longitude = check_out_data.longitude
    
    db.add(attendance_record)
    db.commit()
    db.refresh(attendance_record)
    
    logger.info(
        "User %s checked out from office %s (Record ID: %d)",
        current_user.username, attendance_record.office.name, attendance_record.id
    )
    
    return attendance_record


@router.get("/history", response_model=List[AttendanceRecordSchema])
def get_attendance_history(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get attendance history for the current user.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated user
    
    Returns:
        List of attendance records
    """
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id
    ).order_by(
        AttendanceRecord.check_in_time.desc()
    ).offset(skip).limit(limit).all()
    
    logger.info(
        "Retrieved %d attendance records for user %s",
        len(records), current_user.username
    )
    
    return records


@router.get("/status", response_model=AttendanceRecordSchema)
def get_attendance_status(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current attendance status for the user.
    
    Args:
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Active attendance record
    
    Raises:
        HTTPException: If no active check-in found
    """
    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.user_id == current_user.id,
        AttendanceRecord.check_out_time.is_(None)
    ).first()
    
    if not record:
        logger.info("User %s has no active check-in", current_user.username)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active check-in found.",
        )
    
    logger.info(
        "Retrieved active attendance record for user %s (Record ID: %d)",
        current_user.username, record.id
    )
    
    return record