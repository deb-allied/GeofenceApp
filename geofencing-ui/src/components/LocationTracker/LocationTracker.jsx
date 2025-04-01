import React, { useEffect, useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import GeofenceService from '../../services/geofenceService';
import config from '../../config';
import Logger from '../../utils/logger';
import './LocationTracker.css';

/**
 * Component to track user location and check geofence status
 */
const LocationTracker = ({ 
  onLocationUpdate, 
  onGeofenceUpdate,
  radiusMeters = config.geofence.defaultRadiusMeters,
  checkInterval = config.geofence.checkIntervalMs,
  autoStartTracking = true,
}) => {
  // Get geolocation using custom hook
  const { 
    location, 
    error: locationError, 
    loading: locationLoading,
    tracking,
    startTracking,
    stopTracking,
    getPosition,
  } = useGeolocation({
    enableTracking: autoStartTracking,
  });
  
  // State for geofence status
  const [geofenceResponse, setGeofenceResponse] = useState(null);
  const [geofenceError, setGeofenceError] = useState(null);
  const [geofenceLoading, setGeofenceLoading] = useState(false);
  
  // Handle location updates
  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);
  
  // Check geofence when location updates
  useEffect(() => {
    const checkGeofence = async () => {
      if (!location) return;
      
      try {
        setGeofenceLoading(true);
        setGeofenceError(null);
        
        Logger.info(
          'Checking geofence for location: lat={0}, lng={1}', 
          location.latitude, 
          location.longitude
        );
        
        const response = await GeofenceService.checkGeofence(location, radiusMeters);
        
        setGeofenceResponse(response);
        setGeofenceLoading(false);
        
        if (onGeofenceUpdate) {
          onGeofenceUpdate(response);
        }
        
        // Log buildings within geofence
        const buildingsWithin = response.buildings_within_geofence.filter(
          (status) => status.is_within_geofence
        );
        
        Logger.info(
          'Geofence check completed. {0} of {1} buildings are within the {2}m radius',
          buildingsWithin.length,
          response.buildings_within_geofence.length,
          radiusMeters
        );
      } catch (error) {
        Logger.error('Error checking geofence: {0}', error.message);
        setGeofenceError(error);
        setGeofenceLoading(false);
      }
    };
    
    if (location) {
      checkGeofence();
    }
  }, [location, onGeofenceUpdate, radiusMeters]);
  
  // Set up interval for regular geofence checks
  useEffect(() => {
    if (!checkInterval || checkInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      if (location) {
        Logger.debug('Performing scheduled geofence check');
        GeofenceService.checkGeofence(location, radiusMeters)
          .then((response) => {
            setGeofenceResponse(response);
            if (onGeofenceUpdate) {
              onGeofenceUpdate(response);
            }
          })
          .catch((error) => {
            Logger.error('Error in scheduled geofence check: {0}', error.message);
            setGeofenceError(error);
          });
      }
    }, checkInterval);
    
    return () => clearInterval(intervalId);
  }, [location, onGeofenceUpdate, radiusMeters, checkInterval]);
  
  return (
    <div className="location-tracker">
      <div className="location-status">
        <h3>Location Status</h3>
        <div className="status-indicator">
          <div className={`indicator ${locationLoading ? 'loading' : (location ? 'active' : 'inactive')}`}></div>
          <span>{locationLoading ? 'Getting location...' : (location ? 'Location active' : 'No location')}</span>
        </div>
        
        {locationError && (
          <div className="location-error">
            <p>Error: {locationError.message}</p>
          </div>
        )}
        
        {location && (
          <div className="location-details">
            <p>Latitude: {location.latitude.toFixed(6)}</p>
            <p>Longitude: {location.longitude.toFixed(6)}</p>
            {location.accuracy && <p>Accuracy: ±{Math.round(location.accuracy)}m</p>}
            <p>Updated: {new Date(location.timestamp).toLocaleTimeString()}</p>
          </div>
        )}
      </div>
      
      <div className="tracker-controls">
        {!tracking ? (
          <button 
            className="control-button start" 
            onClick={startTracking}
            disabled={locationLoading}
          >
            Start Tracking
          </button>
        ) : (
          <button 
            className="control-button stop" 
            onClick={stopTracking}
            disabled={locationLoading}
          >
            Stop Tracking
          </button>
        )}
        
        <button 
          className="control-button refresh" 
          onClick={getPosition}
          disabled={locationLoading}
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default LocationTracker;