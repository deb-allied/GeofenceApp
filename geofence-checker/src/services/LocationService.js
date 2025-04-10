import Logger from '../utils/Logger.js';
import Location from '../models/Location.js';

/**
 * Service for handling geolocation operations
 */
class LocationService {
    /**
     * Get the current GPS location of the user
     * @returns {Promise<Location>} A promise that resolves to a Location object
     */
    async getCurrentLocation() {
        Logger.info("Attempting to get current location");
        
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const error = "Geolocation is not supported by this browser";
                Logger.error(error);
                reject(new Error(error));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = new Location(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    Logger.info("Got current location: %o", location);
                    resolve(location);
                },
                (error) => {
                    Logger.error("Error getting location: %o", error);
                    reject(error);
                }
            );
        });
    }
}

export default LocationService;