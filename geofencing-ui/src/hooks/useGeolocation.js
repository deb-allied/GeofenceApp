import { useState, useEffect, useCallback } from 'react';
import config from '../config';
import Logger from '../utils/logger';

/**
 * Custom hook for accessing and tracking the user's geolocation
 * 
 * @param {Object} [options] - Geolocation options
 * @param {boolean} [options.highAccuracy=true] - Whether to use high accuracy mode
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 * @param {number} [options.maximumAge=10000] - Maximum cache age in milliseconds
 * @param {boolean} [options.enableTracking=false] - Whether to enable continuous tracking
 * @returns {Object} Geolocation state and control functions
 */
const useGeolocation = (options = {}) => {
  // Default options
  const {
    highAccuracy = config.locationTracking.highAccuracy,
    timeout = config.locationTracking.timeout,
    maximumAge = config.locationTracking.maximumAge,
    enableTracking = false,
  } = options;

  // State for geolocation
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(enableTracking);
  const [watchId, setWatchId] = useState(null);

  /**
   * Success handler for geolocation API
   * @param {GeolocationPosition} position - Position object from Geolocation API
   */
  const handleSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp;
    
    Logger.debug(
      'Geolocation update: lat={0}, lng={1}, accuracy={2}m', 
      latitude.toFixed(6), 
      longitude.toFixed(6), 
      Math.round(accuracy)
    );
    
    setLocation({
      latitude,
      longitude,
      accuracy,
      timestamp,
    });
    
    setLoading(false);
    setError(null);
  }, []);

  /**
   * Error handler for geolocation API
   * @param {GeolocationPositionError} err - Error object from Geolocation API
   */
  const handleError = useCallback((err) => {
    setError({
      code: err.code,
      message: err.message,
    });
    
    setLoading(false);
    
    Logger.error('Geolocation error: code={0}, message={1}', err.code, err.message);
  }, []);

  /**
   * Get the current position once
   */
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }
    
    setLoading(true);
    
    Logger.info('Getting current position...');
    
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [handleSuccess, handleError, highAccuracy, timeout, maximumAge]);

  /**
   * Start tracking the user's position
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }
    
    if (watchId !== null) {
      // Already tracking
      return;
    }
    
    Logger.info('Starting position tracking...');
    
    setLoading(true);
    setTracking(true);
    
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge,
      }
    );
    
    setWatchId(id);
  }, [handleSuccess, handleError, highAccuracy, timeout, maximumAge, watchId]);

  /**
   * Stop tracking the user's position
   */
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      Logger.info('Stopping position tracking...');
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setTracking(false);
    }
  }, [watchId]);

  // Effect to handle automatic tracking
  useEffect(() => {
    if (enableTracking && !tracking) {
      startTracking();
    }
    
    return () => {
      // Clean up when component unmounts
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableTracking, tracking, startTracking, watchId]);

  return {
    location,
    error,
    loading,
    tracking,
    getPosition,
    startTracking,
    stopTracking,
  };
};

export default useGeolocation;