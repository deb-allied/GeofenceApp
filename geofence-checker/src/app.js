import Logger from './utils/Logger.js';
import LocationService from './services/LocationService.js';
import GeofenceService from './services/GeofenceService.js';

/**
 * Main application class
 */
class App {
    /**
     * Create a new App instance
     * @param {string} geofenceApiUrl - The URL of the geofence checking API
     */
    constructor(geofenceApiUrl) {
        this.locationService = new LocationService();
        this.geofenceService = new GeofenceService(geofenceApiUrl);
        
        this.resultElement = document.getElementById('result');
        this.checkButton = document.getElementById('checkGeofence');
        this.statusElement = document.getElementById('status');
        
        this.bindEvents();
        
        Logger.info("App initialized");
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        this.checkButton.addEventListener('click', this.checkGeofence.bind(this));
    }
    
    /**
     * Update the status message
     * @param {string} message - Status message to display
     */
    updateStatus(message) {
        this.statusElement.innerText = message;
    }
    
    /**
     * Check if the current location is inside the geofence
     */
    async checkGeofence() {
        try {
            this.updateStatus("Getting your location...");
            
            const location = await this.locationService.getCurrentLocation();
            this.resultElement.innerHTML = `
                <p><strong>Your Location:</strong><br>
                Latitude: ${location.latitude.toFixed(6)}<br>
                Longitude: ${location.longitude.toFixed(6)}</p>
            `;
            
            this.updateStatus("Checking geofence...");
            
            const result = await this.geofenceService.checkGeofence(location);
            
            if (result.isInside) {
                this.updateStatus("✅ You are INSIDE the geofence!");
            } else {
                this.updateStatus("❌ You are OUTSIDE the geofence!");
            }
        } catch (error) {
            Logger.error("Error in checkGeofence: %o", error);
            this.updateStatus(`Error: ${error.message}`);
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App('https://your-geofence-api-url.com/api/check-geofence');
});

export default App;