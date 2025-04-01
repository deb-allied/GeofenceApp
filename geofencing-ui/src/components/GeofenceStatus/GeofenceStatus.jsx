import React from 'react';
import './GeofenceStatus.css';
import Logger from '../../utils/logger';

/**
 * Component to display the current geofence status
 */
const GeofenceStatus = ({ 
  geofenceResponse,
  loading = false,
  error = null,
}) => {
  // If loading, show loading state
  if (loading) {
    return (
      <div className="geofence-status loading">
        <div className="status-icon loading-icon"></div>
        <div className="status-text">
          <h2>Checking geofence status...</h2>
          <p>Please wait while we determine your location.</p>
        </div>
      </div>
    );
  }
  
  // If error, show error state
  if (error) {
    Logger.error('GeofenceStatus error: {0}', error.message);
    return (
      <div className="geofence-status error">
        <div className="status-icon error-icon"></div>
        <div className="status-text">
          <h2>Error checking geofence</h2>
          <p>{error.message || 'Failed to determine your geofence status.'}</p>
        </div>
      </div>
    );
  }
  
  // If no geofence response yet, show waiting state
  if (!geofenceResponse) {
    return (
      <div className="geofence-status waiting">
        <div className="status-icon waiting-icon"></div>
        <div className="status-text">
          <h2>Waiting for location</h2>
          <p>Please enable location services to check geofence status.</p>
        </div>
      </div>
    );
  }
  
  // Count buildings within geofence
  const buildingsWithinGeofence = geofenceResponse.buildings_within_geofence.filter(
    status => status.is_within_geofence
  );
  
  const buildingCount = buildingsWithinGeofence.length;
  const isWithinAnyGeofence = buildingCount > 0;
  
  // Get nearest building
  const nearestBuilding = geofenceResponse.buildings_within_geofence.length > 0
    ? geofenceResponse.buildings_within_geofence.reduce(
        (nearest, current) => 
          current.distance_meters < nearest.distance_meters ? current : nearest,
        geofenceResponse.buildings_within_geofence[0]
      )
    : null;
  
  // Return the appropriate status based on the geofence result
  return (
    <div className={`geofence-status ${isWithinAnyGeofence ? 'within' : 'outside'}`}>
      <div className={`status-icon ${isWithinAnyGeofence ? 'within-icon' : 'outside-icon'}`}></div>
      <div className="status-text">
        <h2>
          {isWithinAnyGeofence 
            ? `Within geofence of ${buildingCount} building${buildingCount !== 1 ? 's' : ''}` 
            : 'Outside all geofences'}
        </h2>
        
        {nearestBuilding && (
          <div className="nearest-building">
            <p>
              <strong>Nearest building:</strong> {nearestBuilding.building.name || 'Unnamed building'}
            </p>
            <p>
              <strong>Distance:</strong> {Math.round(nearestBuilding.distance_meters)} meters
            </p>
            <p>
              <strong>Status:</strong> {nearestBuilding.is_within_geofence 
                ? 'Within geofence' 
                : 'Outside geofence'}
            </p>
          </div>
        )}
        
        <p className="timestamp">
          Last updated: {new Date(geofenceResponse.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default GeofenceStatus;