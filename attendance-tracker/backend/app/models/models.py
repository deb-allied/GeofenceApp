from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    """User model for authentication and tracking."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Relationships
    attendance_records = relationship("AttendanceRecord", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.username}>"


class Office(Base):
    """Office location with geofence coordinates."""
    
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius = Column(Float, nullable=False)  # Geofence radius in meters
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attendance_records = relationship("AttendanceRecord", back_populates="office")
    
    def __repr__(self):
        return f"<Office {self.name} ({self.latitude}, {self.longitude})>"


class AttendanceRecord(Base):
    """Records of check-ins and check-outs for attendance tracking."""
    
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=False)
    check_in_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    check_in_latitude = Column(Float, nullable=False)
    check_in_longitude = Column(Float, nullable=False)
    check_out_latitude = Column(Float, nullable=True)
    check_out_longitude = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="attendance_records")
    office = relationship("Office", back_populates="attendance_records")
    
    def __repr__(self):
        status = "Active" if self.check_out_time is None else "Completed"
        return f"<AttendanceRecord {self.id} - User: {self.user_id} - Status: {status}>"