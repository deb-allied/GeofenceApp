import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.models.models import Office
from app.logger import logger

def create_sample_offices():
    """Create sample office data."""
    db = SessionLocal()
    try:
        # Sample offices
        offices = [
            {
            "name": "AWBS Bangalore Office",
            "address": "Indicube Penta, Richmond Rd, Shanthala Nagar, Richmond Town, Bengaluru, Karnataka 560025",
            "latitude": 12.966000031799013,
            "longitude": 77.60360204624122,
            "radius": 500
            },
            {
                "name": "Branch Office",
                "address": "456 Market St, San Francisco, CA",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "radius": 75,
            },
        ]
        
        for office_data in offices:
            office = Office(**office_data)
            db.add(office)
        
        db.commit()
        logger.info("Sample offices created")
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_offices()