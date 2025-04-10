from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, validator


# User Schemas
class UserBase(BaseModel):
    """Base schema for User data."""
    
    email: EmailStr
    username: str
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """Schema for User data as stored in DB."""
    
    id: int
    full_name: Optional[str] = None
    is_admin: bool = False

    class Config:
        orm_mode = True


class User(UserInDB):
    """Schema for User response data."""
    
    pass


# Office Schemas
class OfficeBase(BaseModel):
    """Base schema for Office data."""
    
    name: str
    address: str
    latitude: float
    longitude: float
    radius: float = Field(..., description="Radius of geofence in meters")


class OfficeCreate(OfficeBase):
    """Schema for creating a new office."""
    
    pass


class OfficeUpdate(BaseModel):
    """Schema for updating an office."""
    
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = None


class OfficeInDB(OfficeBase):
    """Schema for Office data as stored in DB."""
    
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Office(OfficeInDB):
    """Schema for Office response data."""
    
    pass


# Attendance Schemas
class AttendanceBase(BaseModel):
    """Base schema for Attendance data."""
    
    user_id: int
    office_id: int


class CheckInCreate(BaseModel):
    """Schema for creating a check-in."""
    
    office_id: int
    latitude: float
    longitude: float


class CheckOutCreate(BaseModel):
    """Schema for creating a check-out."""
    
    latitude: float
    longitude: float


class AttendanceRecord(AttendanceBase):
    """Schema for Attendance response data."""
    
    id: int
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    check_in_latitude: float
    check_in_longitude: float
    check_out_latitude: Optional[float] = None
    check_out_longitude: Optional[float] = None

    class Config:
        orm_mode = True


# Authentication Schemas
class Token(BaseModel):
    """Schema for JWT token response."""
    
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    
    sub: int
    exp: int  # Change this from datetime to int, as JWT stores exp as Unix timestamp


# Location Schemas
class LocationCheck(BaseModel):
    """Schema for checking if a location is within a geofence."""
    
    latitude: float
    longitude: float
    office_id: Optional[int] = None  # If not provided, check against all offices


class GeofenceStatus(BaseModel):
    """Schema for geofence status response."""
    
    is_within_geofence: bool
    office_id: Optional[int] = None
    office_name: Optional[str] = None
    distance: Optional[float] = None  # Distance in meters