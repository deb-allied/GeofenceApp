from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from loguru import logger

from app.api.endpoints import geofence
from app.config import settings
from app.logging_config import LoggingConfig


class GeofencingAPI:
    """Main application class for the Geofencing API."""
    
    def __init__(self) -> None:
        """Initialize the application."""
        # Setup logging
        LoggingConfig.setup_logging()
        
        # Create FastAPI application
        self.app = FastAPI(
            title=settings.api.title,
            description=settings.api.description,
            version=settings.api.version,
            docs_url=settings.api.docs_url,
            redoc_url=settings.api.redoc_url,
            openapi_url=settings.api.openapi_url,
            debug=settings.debug
        )
        
        # Setup CORS
        self._setup_cors()
        
        # Register event handlers
        self._register_events()
        
        # Register API routes
        self._register_routes()
        
        logger.info("GeofencingAPI initialized")
    
    def _setup_cors(self) -> None:
        """Setup CORS middleware."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, restrict this to your frontend domain
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        logger.debug("CORS middleware configured")
    
    def _register_events(self) -> None:
        """Register application event handlers."""
        @self.app.on_event("startup")
        async def startup_event() -> None:
            logger.info("Application starting up")
        
        @self.app.on_event("shutdown")
        async def shutdown_event() -> None:
            logger.info("Application shutting down")
    
    def _register_routes(self) -> None:
        """Register API routes."""
        # Include routers from different modules
        self.app.include_router(geofence.router)
        
        # Add a simple health check endpoint
        @self.app.get("/health", tags=["health"])
        async def health_check() -> dict:
            return {"status": "ok"}
        
        logger.debug("API routes registered")
    
    def run(self, host: str = "0.0.0.0", port: int = 8000) -> None:
        """
        Run the application.
        
        Args:
            host: Host to run the server on
            port: Port to run the server on
        """
        logger.info("Starting GeofencingAPI on http://{}:{}", host, port)
        uvicorn.run(self.app, host=host, port=port)


# Create application instance
app = GeofencingAPI().app

if __name__ == "__main__":
    # Run the application directly if this file is executed
    GeofencingAPI().run()