from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import attendance, auth, offices
from app.config import settings
from app.db.base import Base, engine
from app.logger import logger

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # If no specific origins set, allow all
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(offices.router, prefix=f"{settings.API_V1_STR}/offices", tags=["offices"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_STR}/attendance", tags=["attendance"])


@app.get("/")
def root():
    """Root endpoint for API health check."""
    return {"message": "Welcome to the Attendance Tracker API"}


@app.on_event("startup")
async def startup_event():
    """Execute tasks at application startup."""
    logger.info("Starting up Attendance Tracker API")


@app.on_event("shutdown")
async def shutdown_event():
    """Execute tasks at application shutdown."""
    logger.info("Shutting down Attendance Tracker API")


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Attendance Tracker API server")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)