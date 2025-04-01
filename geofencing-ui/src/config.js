/**
 * Application configuration
 */
const config = {
  // API configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 5000,
  },
  
  // Map configuration
  map: {
    // Default center coordinates (can be overridden by user's location)
    defaultCenter: {
      latitude: 40.7128,  // New York City
      longitude: -74.0060,
    },
    defaultZoom: 16,
    maxZoom: 19,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  
  // Geofencing configuration
  geofence: {
    defaultRadiusMeters: 100,
    checkIntervalMs: 10000000000000000,  // Increased to 30 seconds (from 10 seconds)
    geofenceCircleColor: '#3388ff',
    geofenceCircleOpacity: 0.2,
    buildingMarkerColor: '#ff3333',
    buildingWithinGeofenceColor: '#33ff33',
  },
  
  // Location tracking configuration
  locationTracking: {
    highAccuracy: true,
    maximumAge: 300000,  // Increased to 30 seconds (from 10 seconds)
    timeout: 100000,     // Increased to 10 seconds (from 5 seconds)
    throttleMs: 150000,  // Updated setting: Throttle position updates to 150 seconds
  }
};

export default config;