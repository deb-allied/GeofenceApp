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
   * Check if a user is within geofence of predefined buildings
   * 
   * @param {Object} coordinates - User coordinates
   * @param {number} coordinates.latitude - User latitude
   * @param {number} coordinates.longitude - User longitude
   * @param {string} [buildingId] - Optional ID of specific building to check
   * @returns {Promise<Object>} Geofence check response
   */
  async checkGeofence(coordinates, buildingId = null) {
    try {
      const url = '/geofence/check';
      const data = {
        user_location: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }
      };
      
      // If buildingId is provided, add it as a query parameter
      const config = {};
      if (buildingId) {
        config.params = { building_id: buildingId };
      }
      
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      Logger.error('Failed to check geofence: {0}', error.message);
      throw error;
    }
  }
  
  /**
   * Get all predefined buildings
   * 
   * @returns {Promise<Object>} List of buildings
   */
  async getBuildings() {
    try {
      const response = await this.client.get('/buildings');
      return response.data;
    } catch (error) {
      Logger.error('Failed to get buildings: {0}', error.message);
      throw error;
    }
  }
  
  /**
   * Get a specific building by ID
   * 
   * @param {string} buildingId - ID of the building to get
   * @returns {Promise<Object>} Building details
   */
  async getBuilding(buildingId) {
    try {
      const response = await this.client.get(`/buildings/${buildingId}`);
      return response.data;
    } catch (error) {
      Logger.error('Failed to get building {0}: {1}', buildingId, error.message);
      throw error;
    }
  }
  
  /**
   * Create a new building
   * 
   * @param {Object} buildingData - Building data
   * @returns {Promise<Object>} Created building
   */
  async createBuilding(buildingData) {
    try {
      const response = await this.client.post('/buildings', buildingData);
      return response.data;
    } catch (error) {
      Logger.error('Failed to create building: {0}', error.message);
      throw error;
    }
  }
  
  /**
   * Update an existing building
   * 
   * @param {string} buildingId - ID of the building to update
   * @param {Object} buildingData - New building data
   * @returns {Promise<Object>} Updated building
   */
  async updateBuilding(buildingId, buildingData) {
    try {
      const response = await this.client.put(`/buildings/${buildingId}`, buildingData);
      return response.data;
    } catch (error) {
      Logger.error('Failed to update building {0}: {1}', buildingId, error.message);
      throw error;
    }
  }
  
  /**
   * Delete a building
   * 
   * @param {string} buildingId - ID of the building to delete
   * @returns {Promise<void>}
   */
  async deleteBuilding(buildingId) {
    try {
      await this.client.delete(`/buildings/${buildingId}`);
    } catch (error) {
      Logger.error('Failed to delete building {0}: {1}', buildingId, error.message);
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