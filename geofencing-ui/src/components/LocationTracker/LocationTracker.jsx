import React, { useEffect, useState, useRef } from 'react';
import useGeolocation from '../../hooks/useGeolocation';
import apiService from '../../services/api';
import config from '../../config';
import Logger from '../../utils/logger';
import './LocationTracker.css';

/**
 * Component to track user location and check geofence status
 */
const LocationTracker = ({ 
  onLocationUpdate, 
  onGeofenceUpdate,
  onGeofenceError,
  selectedBuildingId = null,
  checkInterval = config.geofence.checkIntervalMs,
  autoStartTracking = true,
  trackingOptions = {
    highAccuracy: config.locationTracking.highAccuracy,
    maximumAge: config.locationTracking.maximumAge,
    timeout: config.locationTracking.timeout,
    throttleMs: config.locationTracking.throttleMs
  }
}) => {
  // Get geolocation using custom hook with slower frequency
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
    ...trackingOptions
  });
  
  // State for geofence status
  const [geofenceLoading, setGeofenceLoading] = useState(false);
  
  // State for tracking settings display
  const [showSettings, setShowSettings] = useState(false);
  
  // Keep a reference to the interval ID for cleanup
  const intervalRef = useRef(null);
  
  // Flag to track if a single update is in progress
  const [singleUpdateInProgress, setSingleUpdateInProgress] = useState(false);
  
  // Display the current tracking frequency in human-readable format
  const getFrequencyText = () => {
    const interval = trackingOptions.throttleMs || config.locationTracking.throttleMs;
    if (interval < 1000) return `${interval}ms`;
    if (interval < 60000) return `${interval / 1000} seconds`;
    return `${interval / 60000} minutes`;
  };
  
  // Display the current geofence check interval in human-readable format
  const getCheckIntervalText = () => {
    const interval = checkInterval;
    if (interval < 1000) return `${interval}ms`;
    if (interval < 60000) return `${interval / 1000} seconds`;
    return `${interval / 60000} minutes`;
  };
  
  // Handle location updates
  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);
  
  // Check geofence when location updates or selected building changes
  useEffect(() => {
    const checkGeofence = async () => {
      if (!location) return;
      
      try {
        setGeofenceLoading(true);
        
        Logger.info(
          'Checking geofence for location: lat={0}, lng={1}, building ID: {2}', 
          location.latitude, 
          location.longitude,
          selectedBuildingId || 'all'
        );
        
        const response = await apiService.checkGeofence(location, selectedBuildingId);
        
        setGeofenceLoading(false);
        
        if (onGeofenceUpdate) {
          onGeofenceUpdate(response);
        }
        
        // Log buildings within geofence
        const buildingsWithin = response.buildings_within_geofence.filter(
          (status) => status.is_within_geofence
        );
        
        Logger.info(
          'Geofence check completed. {0} of {1} buildings are within their geofence radius',
          buildingsWithin.length,
          response.buildings_within_geofence.length
        );
        
        // If this was a single update, reset the flag
        if (singleUpdateInProgress) {
          setSingleUpdateInProgress(false);
          Logger.debug('Single location update completed');
        }
      } catch (error) {
        Logger.error('Error checking geofence: {0}', error.message);
        setGeofenceLoading(false);
        
        if (onGeofenceError) {
          onGeofenceError(error);
        }
        
        // Reset single update flag on error as well
        if (singleUpdateInProgress) {
          setSingleUpdateInProgress(false);
        }
      }
    };
    
    if (location && (tracking || singleUpdateInProgress)) {
      checkGeofence();
    }
  }, [location, selectedBuildingId, onGeofenceUpdate, onGeofenceError, tracking, singleUpdateInProgress]);
  
  // Set up interval for regular geofence checks with slower frequency
  useEffect(() => {
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only set up interval if tracking is active (and NOT in single update mode)
    if (tracking && !singleUpdateInProgress && checkInterval && checkInterval > 0 && location) {
      intervalRef.current = setInterval(() => {
        Logger.debug('Performing scheduled geofence check (interval: {0}ms)', checkInterval);
        apiService.checkGeofence(location, selectedBuildingId)
          .then((response) => {
            if (onGeofenceUpdate) {
              onGeofenceUpdate(response);
            }
          })
          .catch((error) => {
            Logger.error('Error in scheduled geofence check: {0}', error.message);
            if (onGeofenceError) {
              onGeofenceError(error);
            }
          });
      }, checkInterval);
      
      Logger.debug('Started regular geofence checking interval: {0}ms', checkInterval);
    }
    
    // Cleanup function that will run when component unmounts or dependencies change
    return () => {
      if (intervalRef.current) {
        Logger.debug('Clearing geofence checking interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [location, selectedBuildingId, checkInterval, onGeofenceUpdate, onGeofenceError, tracking, singleUpdateInProgress]);
  
  // Custom stop tracking handler that also cleans up the interval
  const handleStopTracking = () => {
    // Stop geolocation tracking
    stopTracking();
    
    // Clear any active interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      Logger.debug('Cleared geofence checking interval due to stopping tracking');
    }
    
    Logger.info('Location tracking stopped');
  };
  
  // Handler for the "Update Now" button to get a single position update without continuous tracking
  const handleSingleUpdate = async () => {
    Logger.info('Performing single location update');
    
    // Set flag to indicate a single update is in progress
    setSingleUpdateInProgress(true);
    
    try {
      // Get current position once without starting continuous tracking
      await getPosition();
    } catch (error) {
      Logger.error('Error getting single position update: {0}', error.message);
      setSingleUpdateInProgress(false);
    }
  };
  
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
        
        <div className="tracking-frequency">
          <button 
            className="frequency-toggle" 
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
          
          {showSettings && (
            <div className="frequency-details">
              <p>Location update frequency: {getFrequencyText()}</p>
              <p>Geofence check interval: {getCheckIntervalText()}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="tracker-controls">
        {!tracking ? (
          <button 
            className="control-button start" 
            onClick={startTracking}
            disabled={locationLoading || singleUpdateInProgress}
          >
            Start Tracking
          </button>
        ) : (
          <button 
            className="control-button stop" 
            onClick={handleStopTracking}
            disabled={locationLoading}
          >
            Stop Tracking
          </button>
        )}
        
        <button 
          className="control-button refresh" 
          onClick={handleSingleUpdate}
          disabled={locationLoading || geofenceLoading || singleUpdateInProgress}
        >
          Update Now
        </button>
      </div>
      
      {selectedBuildingId && (
        <div className="selected-building-info">
          <p>Checking geofence for selected building</p>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;