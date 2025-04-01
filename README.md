# Geofencing API

A comprehensive geofencing solution that tracks user locations via GPS and determines proximity to buildings.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Backend](#backend)
  - [Tech Stack](#backend-tech-stack)
  - [Directory Structure](#backend-directory-structure)
  - [Components](#backend-components)
  - [API Endpoints](#api-endpoints)
  - [Algorithm](#algorithm)
- [Frontend](#frontend)
  - [Tech Stack](#frontend-tech-stack)
  - [Directory Structure](#frontend-directory-structure)
  - [Components](#frontend-components)
  - [State Management](#state-management)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)

## Project Overview

This geofencing solution allows tracking users via GPS and determining whether they are within a configurable radius (default: 100m) of buildings. The system uses OpenStreetMap data to identify buildings and implements the Haversine formula for accurate distance calculations.

The application consists of a FastAPI backend for handling geolocation processing and a React frontend for visualization and user interaction.

## Features

- **Real-time location tracking** using browser's Geolocation API
- **Building data** retrieved from OpenStreetMap
- **Efficient distance calculation** using the Haversine formula (O(1) time complexity)
- **Configurable geofence radius** (default: 100m)
- **Interactive map visualization** of user location, buildings, and geofence boundaries
- **Real-time status updates** when entering/exiting geofence areas
- **Comprehensive logging** for debugging and monitoring
- **OOP-based architecture** for maintainability and extensibility

## System Architecture

The system follows a client-server architecture:

- **Backend**: FastAPI server that handles geofencing calculations, building data retrieval, and location processing
- **Frontend**: React application that provides user interface with map visualization and status indicators
- **External Services**: OpenStreetMap API for retrieving building data

## Backend

### Backend Tech Stack

- **FastAPI**: High-performance asynchronous API framework
- **Poetry**: Dependency management
- **Pydantic**: Data validation and settings management
- **HTTPX**: Asynchronous HTTP client for API requests
- **Loguru**: Structured logging
- **Uvicorn**: ASGI server for running the application

### Backend Directory Structure

```
geofencing-api/
├── pyproject.toml
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── logging_config.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── location.py
│   │   └── geofence.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── geofence_service.py
│   │   ├── location_service.py
│   │   └── osm_service.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── geofence.py
│   │   │   └── location.py
│   └── utils/
│       ├── __init__.py
│       └── distance_calculator.py
└── tests/
    ├── __init__.py
    ├── test_geofence_service.py
    └── test_location_service.py
```

### Backend Components

#### Models

- **location.py**: Defines data models for geographic coordinates, user location, and buildings
- **geofence.py**: Defines data models for geofence requests and responses

#### Services

- **geofence_service.py**: Core business logic for geofencing operations
  - Determines if a user is within a geofence of one or more buildings
  - Calculates proximity and generates status reports
  
- **osm_service.py**: Interfaces with OpenStreetMap API
  - Retrieves building data near specified coordinates
  - Performs reverse geocoding to get location information
  
- **location_service.py**: Handles user location data processing

#### Utils

- **distance_calculator.py**: Implements the Haversine formula
  - Calculates great-circle distance between geographic coordinates
  - Determines if points are within a specific radius

#### API Endpoints

- **/geofence/check**: Checks if a user is within the geofence of any buildings

### Algorithm

The backend uses the Haversine formula to calculate the great-circle distance between two points on the Earth's surface:

```python
def haversine_distance(point1, point2):
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(point1.latitude)
    lon1_rad = math.radians(point1.longitude)
    lat2_rad = math.radians(point2.latitude)
    lon2_rad = math.radians(point2.longitude)
    
    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = (
        math.sin(dlat / 2) ** 2 + 
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # Distance in meters
    distance = EARTH_RADIUS_METERS * c
    
    return distance
```

This algorithm has a time complexity of O(1), making it highly efficient even for applications that need to process many coordinates.

## Frontend

### Frontend Tech Stack

- **React**: UI library for building the user interface
- **Leaflet/React-Leaflet**: Interactive map components
- **Axios**: HTTP client for API requests
- **CSS**: Styling

### Frontend Directory Structure

```
geofencing-ui/
├── package.json
├── public/
│   ├── index.html
│   └── favicon.ico
└── src/
    ├── index.js
    ├── App.js
    ├── config.js
    ├── components/
    │   ├── Map/
    │   │   ├── Map.jsx
    │   │   ├── Map.css
    │   │   └── index.js
    │   ├── GeofenceStatus/
    │   │   ├── GeofenceStatus.jsx
    │   │   ├── GeofenceStatus.css
    │   │   └── index.js
    │   └── LocationTracker/
    │       ├── LocationTracker.jsx
    │       ├── LocationTracker.css
    │       └── index.js
    ├── services/
    │   ├── api.js
    │   ├── geofenceService.js
    │   └── locationService.js
    ├── hooks/
    │   └── useGeolocation.js
    └── utils/
        └── logger.js
```

### Frontend Components

#### Map Component
- Displays an interactive map with:
  - User's current location
  - Geofence radius as a circle
  - Building markers with color-coding for geofence status
  - Popups with detailed information

#### GeofenceStatus Component
- Displays the current geofence status:
  - Whether the user is within any building's geofence
  - Number of buildings within range
  - Distance to the nearest building
  - Last update timestamp

#### LocationTracker Component
- Manages user location tracking:
  - Controls for starting/stopping tracking
  - Manual location update button
  - Display of current coordinates and accuracy
  - Error handling for location services

### State Management

The frontend uses React's built-in state management with hooks:

- **useGeolocation**: Custom hook for accessing and tracking user location
  - Provides real-time location updates
  - Handles location errors and loading states
  - Controls for tracking state (start/stop)

- **App.js**: Manages global state
  - User location
  - Geofence response data
  - Radius settings
  - Loading and error states

## Installation & Setup

### Backend Setup

1. Install Poetry (dependency management tool):
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/geofencing-api.git
   cd geofencing-api
   poetry install
   ```

3. Run the backend server:
   ```bash
   poetry run python -m app.main
   ```
   The API will be available at http://localhost:8000

### Frontend Setup

1. Install dependencies:
   ```bash
   cd geofencing-ui
   npm install
   ```

2. Run the development server:
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3000

## Usage

1. Open the application in a browser
2. Allow location access when prompted
3. The map will center on your current location with a 100m geofence radius
4. Buildings within the radius will be highlighted
5. Check the GeofenceStatus panel for detailed information
6. Adjust the radius using the slider in the header

## Configuration

### Backend Configuration

Configuration is managed in `app/config.py` using Pydantic models:

- **APIConfig**: API settings (title, version, docs URL)
- **GeofenceConfig**: Geofencing parameters (default radius, max buildings)
- **OSMConfig**: OpenStreetMap API settings (base URL, user agent, timeout)
- **DatabaseConfig**: Database settings (for future expansion)

### Frontend Configuration

Configuration is managed in `src/config.js`:

- **api**: API connection settings (base URL, timeout)
- **map**: Map configuration (default center, zoom levels, tile sources)
- **geofence**: Geofencing settings (default radius, check interval, colors)
- **locationTracking**: Location tracking parameters (accuracy, refresh rates)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request