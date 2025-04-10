import Logger from '../utils/Logger.js';

/**
 * Service for interacting with the geofence API
 */
class GeofenceService {
    /**
     * Create a new GeofenceService instance
     * @param {string} apiUrl - The URL of the geofence checking API
     */
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        Logger.info("GeofenceService initialized with API URL: %s", this.apiUrl);
    }
    
    /**
     * Check if a location is inside a geofence
     * @param {Location} location - The location to check
     * @returns {Promise<Object>} A promise that resolves to the API response
     */
    async checkGeofence(location) {
        Logger.info("Checking if location is inside geofence: %o", location);
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude: location.latitude,
                    longitude: location.longitude
                }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            Logger.info("Geofence check result: %o", data);
            
            return data;
        } catch (error) {
            Logger.error("Error checking geofence: %o", error);
            throw error;
        }
    }
}

export default GeofenceService;