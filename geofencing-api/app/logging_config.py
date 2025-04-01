import sys
import os
from pathlib import Path
from loguru import logger

class LoggingConfig:
    """Configures application logging."""
    
    @classmethod
    def setup_logging(cls) -> None:
        """Sets up logging configuration for the application."""
        log_level = os.getenv("LOG_LEVEL", "INFO")
        
        # Remove default logger
        logger.remove()
        
        # Add console logger
        logger.add(
            sys.stderr,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
            level=log_level,
            backtrace=True,
            diagnose=True,
        )
        
        # Add file logger
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        logger.add(
            log_dir / "geofencing_api.log",
            rotation="10 MB",
            retention="1 month",
            compression="zip",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} - {message}",
            level=log_level,
            backtrace=True,
            diagnose=True,
        )
        
        logger.info("Logging initialized at level: {}", log_level)