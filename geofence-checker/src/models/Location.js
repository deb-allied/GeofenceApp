/**
 * Model class for representing geographic coordinates
 */
class Location {
    /**
     * Create a new Location instance
     * @param {number} latitude - The latitude coordinate
     * @param {number} longitude - The longitude coordinate
     */
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    /**
     * Get string representation of the location
     * @returns {string} Formatted location string
     */
    toString() {
        return `Location(lat: ${this.latitude}, lng: ${this.longitude})`;
    }
}

export default Location;