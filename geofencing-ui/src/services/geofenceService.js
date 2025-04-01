import apiService from './api';
import config from '../config';
import Logger from '../utils/logger';

/**
 * Service to handle geofencing operations
 */
class GeofenceService {
  /**
   * Calculate distance between two points using Haversine formula
   * 
   * @param {Object} point1 - First point coordinates
   * @param {number} point1.latitude - Latitude of the first point
   * @param {number} point1.longitude - Longitude of the first point
   * @param {Object} point2 - Second point coordinates
   * @param {number} point2.latitude - Latitude of the second point
   * @param {number} point2.longitude - Longitude of the second point
   * @returns {number} Distance in meters
   */
  static calculateHaversineDistance(point1, point2) {
    // Convert latitude and longitude from degrees to radians
    const lat1 = (point1.latitude * Math.PI) / 180;
    const lon1 = (point1.longitude * Math.PI) / 180;
    const lat2 = (point2.latitude * Math.PI) / 180;
    const lon2 = (point2.longitude * Math.PI) / 180;

    // Haversine formula
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Earth radius in meters
    const R = 6371000;
    const distance = R * c;
    
    return distance;
  }

  /**
   * Check if the user is within the geofence of any buildings
   * 
   * @param {Object} userLocation - User's location coordinates
   * @param {number} userLocation.latitude - User's latitude
   * @param {number} userLocation.longitude - User's longitude
   * @param {number} [radiusMeters] - Radius in meters to check for geofence
   * @returns {Promise<Object>} Geofence check result
   */
  static async checkGeofence(userLocation, radiusMeters = config.geofence.defaultRadiusMeters) {
    Logger.info(
      'Checking geofence for location: lat={0}, lng={1}, radius={2}m', 
      userLocation.latitude, 
      userLocation.longitude, 
      radiusMeters
    );
    
    return apiService.checkGeofence(userLocation, radiusMeters);
  }

  /**
   * Calculate if a point is within a certain radius of another point
   * 
   * @param {Object} point1 - First point coordinates
   * @param {number} point1.latitude - Latitude of the first point
   * @param {number} point1.longitude - Longitude of the first point
   * @param {Object} point2 - Second point coordinates
   * @param {number} point2.latitude - Latitude of the second point
   * @param {number} point2.longitude - Longitude of the second point
   * @param {number} radiusMeters - Radius in meters
   * @returns {boolean} Whether the points are within the specified radius
   */
  static isWithinRadius(point1, point2, radiusMeters) {
    const distance = GeofenceService.calculateHaversineDistance(point1, point2);
    const isWithin = distance <= radiusMeters;
    
    Logger.debug(
      'Distance between points: {0}m, within {1}m radius: {2}',
      Math.round(distance),
      radiusMeters,
      isWithin
    );
    
    return isWithin;
  }
  
  /**
   * Get the nearest building from a list of buildings to a point
   * 
   * @param {Object} userLocation - User's location coordinates
   * @param {number} userLocation.latitude - User's latitude
   * @param {number} userLocation.longitude - User's longitude
   * @param {Array<Object>} buildings - List of buildings
   * @returns {Object|null} Nearest building and distance or null if no buildings
   */
  static getNearestBuilding(userLocation, buildings) {
    if (!buildings || buildings.length === 0) {
      return null;
    }
    
    let nearestBuilding = null;
    let shortestDistance = Infinity;
    
    buildings.forEach(building => {
      const distance = GeofenceService.calculateHaversineDistance(
        userLocation,
        building.coordinates
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestBuilding = {
          ...building,
          distance
        };
      }
    });
    
    return {
      building: nearestBuilding,
      distance: shortestDistance
    };
  }
}

export default GeofenceService;