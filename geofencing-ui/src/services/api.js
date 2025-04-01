import axios from 'axios';
import config from '../config';
import Logger from '../utils/logger';

/**
 * API service for communication with the backend
 */
class ApiService {
  /**
   * Create a new ApiService instance
   */
  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use((request) => {
      Logger.logApiRequest(request.method.toUpperCase(), request.url, request.data);
      return request;
    });
    
    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        Logger.logApiResponse(
          response.config.method.toUpperCase(), 
          response.config.url, 
          response.data
        );
        return response;
      },
      (error) => {
        Logger.logApiError(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || 'UNKNOWN',
          error
        );
        return Promise.reject(error);
      }
    );
    
    Logger.info('ApiService initialized with baseURL: {0}', config.api.baseUrl);
  }
  
  /**
   * Check if a user is within geofence of any buildings
   * 
   * @param {Object} coordinates - User coordinates
   * @param {number} coordinates.latitude - User latitude
   * @param {number} coordinates.longitude - User longitude
   * @param {number} [radiusMeters] - Radius in meters to check for geofence
   * @returns {Promise<Object>} Geofence check response
   */
  async checkGeofence(coordinates, radiusMeters = config.geofence.defaultRadiusMeters) {
    try {
      const response = await this.client.post('/geofence/check', {
        user_location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        radius_meters: radiusMeters,
      });
      
      return response.data;
    } catch (error) {
      Logger.error('Failed to check geofence: {0}', error.message);
      throw error;
    }
  }
  
  /**
   * Health check endpoint
   * 
   * @returns {Promise<Object>} Health check response
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      Logger.error('Health check failed: {0}', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;