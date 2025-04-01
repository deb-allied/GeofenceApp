import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import GeofenceStatus from './components/GeofenceStatus';
import LocationTracker from './components/LocationTracker';
import BuildingManager from './components/BuildingManager';
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
  
  // State for selected building
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  
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
      'Geofence updated: {0} of {1} buildings within their geofence radius',
      buildingsWithin,
      response.buildings_within_geofence.length
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
  
  // Handle building selection
  const handleBuildingSelect = (buildingId) => {
    setSelectedBuildingId(buildingId);
    Logger.info('Selected building for geofencing: {0}', buildingId);
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Geofencing App</h1>
        <p className="app-description">
          Track your location and see if you're within the geofence of predefined buildings
        </p>
      </header>
      
      <main className="app-content">
        <div className="left-panel">
          <BuildingManager onBuildingSelect={handleBuildingSelect} />
          
          <GeofenceStatus
            geofenceResponse={geofenceResponse}
            loading={geofenceLoading}
            error={geofenceError}
            selectedBuildingId={selectedBuildingId}
          />
          
          <LocationTracker
            onLocationUpdate={handleLocationUpdate}
            onGeofenceUpdate={handleGeofenceUpdate}
            onGeofenceError={handleGeofenceError}
            selectedBuildingId={selectedBuildingId}
            autoStartTracking={true}
          />
        </div>
        
        <div className="map-section">
          <Map
            userLocation={userLocation}
            geofenceResponse={geofenceResponse}
            selectedBuildingId={selectedBuildingId}
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