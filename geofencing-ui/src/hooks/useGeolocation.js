import { useState, useEffect, useCallback, useRef } from 'react';
import config from '../config';
import Logger from '../utils/logger';

/**
 * Custom hook for accessing and tracking the user's geolocation
 * with throttling to reduce update frequency
 * 
 * @param {Object} [options] - Geolocation options
 * @param {boolean} [options.highAccuracy=true] - Whether to use high accuracy mode
 * @param {number} [options.timeout=1000] - Timeout in milliseconds
 * @param {number} [options.maximumAge=300000] - Maximum cache age in milliseconds
 * @param {number} [options.throttleMs=150000] - Throttle updates to this frequency in milliseconds
 * @param {boolean} [options.enableTracking=false] - Whether to enable continuous tracking
 * @returns {Object} Geolocation state and control functions
 */
const useGeolocation = (options = {}) => {
  // Default options
  const {
    highAccuracy = config.locationTracking.highAccuracy,
    timeout = config.locationTracking.timeout,
    maximumAge = config.locationTracking.maximumAge,
    throttleMs = config.locationTracking.throttleMs,
    enableTracking = false,
  } = options;

  // State for geolocation
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(enableTracking);
  
  // Use ref for watch ID to maintain it across renders
  const watchIdRef = useRef(null);
  
  // Refs for throttling
  const lastUpdateTimeRef = useRef(0);
  const lastPositionRef = useRef(null);
  const throttleTimeoutRef = useRef(null);

  /**
   * Process a position update with throttling
   * @param {GeolocationPosition} position - Position object from Geolocation API
   */
  const processPositionUpdate = useCallback((position) => {
    const now = Date.now();
    lastPositionRef.current = position;
    
    // If we haven't updated recently, update immediately
    if (now - lastUpdateTimeRef.current <= throttleMs) {
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
      
      lastUpdateTimeRef.current = now;
      setLoading(false);
      setError(null);
    } else {
      // Otherwise, schedule an update for later if one isn't already scheduled
      if (!throttleTimeoutRef.current) {
        const delay = throttleMs - (now - lastUpdateTimeRef.current);
        
        Logger.debug('Throttling position update. Next update in {0}ms', delay);
        
        throttleTimeoutRef.current = setTimeout(() => {
          const lastPosition = lastPositionRef.current;
          if (lastPosition) {
            const { latitude, longitude, accuracy } = lastPosition.coords;
            const timestamp = lastPosition.timestamp;
            
            Logger.debug(
              'Throttled geolocation update: lat={0}, lng={1}, accuracy={2}m', 
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
            
            lastUpdateTimeRef.current = Date.now();
          }
          
          throttleTimeoutRef.current = null;
        }, delay);
      }
      
      // Still update the loading state
      setLoading(false);
    }
  }, [throttleMs]);

  /**
   * Success handler for geolocation API
   * @param {GeolocationPosition} position - Position object from Geolocation API
   */
  const handleSuccess = useCallback((position) => {
    processPositionUpdate(position);
  }, [processPositionUpdate]);

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
    
    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Reset throttling state
    lastUpdateTimeRef.current = 0;
    
    Logger.info('Starting position tracking with reduced frequency...');
    
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
    
    watchIdRef.current = id;
    Logger.debug('Started geolocation watch with ID: {0}', id);
  }, [handleSuccess, handleError, highAccuracy, timeout, maximumAge]);

  /**
   * Stop tracking the user's position
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Logger.info('Stopping position tracking with watch ID: {0}...', watchIdRef.current);
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      
      // Clear any pending throttled updates
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
      
      setTracking(false);
      Logger.debug('Position tracking stopped');
    }
  }, []);

  // Effect to handle automatic tracking
  useEffect(() => {
    if (enableTracking && !tracking) {
      startTracking();
    }
    
    // Clean up when component unmounts
    return () => {
      if (watchIdRef.current !== null) {
        Logger.debug('Cleaning up geolocation watch on unmount');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [enableTracking, tracking, startTracking]);

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