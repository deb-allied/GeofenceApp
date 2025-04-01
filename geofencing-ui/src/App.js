import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import GeofenceStatus from './components/GeofenceStatus';
import LocationTracker from './components/LocationTracker';
import config from './config';
import Logger from './utils/logger';
import './App.css';

const App = () => {
  // State for user location
  const [userLocation, setUserLocation] = useState(null);
  
  // State for geofence result
  const [geofenceResponse, setGeofenceResponse] = useState(null);
  const [geofenceLoading, setGeofenceLoading] = useState(false);
  const [geofenceError, setGeofenceError] = useState(null);
  
  // State for radius
  const [radiusMeters, setRadiusMeters] = useState(config.geofence.defaultRadiusMeters);
  
  // Handle location updates from LocationTracker
  const handleLocationUpdate = (location) => {
    Logger.info(
      'Location updated: lat={0}, lng={1}, accuracy={2}m',
      location.latitude.toFixed(6),
      location.longitude.toFixed(6),
      location.accuracy ? Math.round(location.accuracy) : 'unknown'
    );
    
    setUserLocation(location);
  };
  
  // Handle geofence updates from LocationTracker
  const handleGeofenceUpdate = (response) => {
    const buildingsWithin = response.buildings_within_geofence.filter(
      status => status.is_within_geofence
    ).length;
    
    Logger.info(
      'Geofence updated: {0} of {1} buildings within {2}m radius',
      buildingsWithin,
      response.buildings_within_geofence.length,
      response.radius_meters
    );
    
    setGeofenceResponse(response);
    setGeofenceLoading(false);
    setGeofenceError(null);
  };
  
  // Handle geofence error
  const handleGeofenceError = (error) => {
    Logger.error('Geofence error: {0}', error.message);
    setGeofenceError(error);
    setGeofenceLoading(false);
  };
  
  // Handle radius change
  const handleRadiusChange = (event) => {
    const newRadius = parseInt(event.target.value, 10);
    setRadiusMeters(newRadius);
    
    Logger.debug('Radius changed to {0}m', newRadius);
    
    // Set loading state when radius changes
    if (geofenceResponse) {
      setGeofenceLoading(true);
    }
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Geofencing App</h1>
        <div className="radius-control">
          <label htmlFor="radius-slider">Geofence Radius: {radiusMeters}m</label>
          <input
            id="radius-slider"
            type="range"
            min="10"
            max="500"
            step="10"
            value={radiusMeters}
            onChange={handleRadiusChange}
          />
        </div>
      </header>
      
      <main className="app-content">
        <div className="map-section">
          <Map
            userLocation={userLocation}
            radiusMeters={radiusMeters}
            geofenceResponse={geofenceResponse}
          />
        </div>
        
        <div className="sidebar">
          <GeofenceStatus
            geofenceResponse={geofenceResponse}
            loading={geofenceLoading}
            error={geofenceError}
          />
          
          <LocationTracker
            onLocationUpdate={handleLocationUpdate}
            onGeofenceUpdate={handleGeofenceUpdate}
            radiusMeters={radiusMeters}
            checkInterval={config.geofence.checkIntervalMs}
            autoStartTracking={true}
          />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Geofencing App</p>
      </footer>
    </div>
  );
};

export default App;