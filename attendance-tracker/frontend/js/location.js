/**
 * Location and map-related functionality
 */
class LocationService {
    constructor() {
        // Initialize map and markers properties
        this.map = null;
        this.userMarker = null;
        this.officeMarkers = [];
        this.geofenceCircles = [];
        this.currentPosition = null;
    }

    /**
     * Initialize the map
     */
    initMap() {
        // Create the map centered at default location
        this.map = L.map('map').setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        // Locate the user immediately
        this.locateUser();
        
        // Load offices data
        this.loadOffices();
    }

    /**
     * Get the user's current position
     * @returns {Promise<GeolocationPosition>} The position
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    this.currentPosition = position;
                    resolve(position);
                },
                error => {
                    console.error('Geolocation error:', error);
                    reject(error);
                },
                { enableHighAccuracy: true }
            );
        });
    }

    /**
     * Locate the user on the map
     */
    async locateUser() {
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            // Update coordinates display
            document.getElementById('coordinates').textContent = 
                `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            
            // Create or update user marker
            if (this.userMarker) {
                this.userMarker.setLatLng([latitude, longitude]);
            } else {
                this.userMarker = L.marker([latitude, longitude], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: `<div style="background-color: ${CONFIG.USER_MARKER_COLOR}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
                        iconSize: [15, 15],
                        iconAnchor: [7.5, 7.5]
                    })
                }).addTo(this.map);
                this.userMarker.bindPopup('Your Location').openPopup();
            }
            
            // Center map on user's location
            this.map.setView([latitude, longitude], CONFIG.DEFAULT_MAP_ZOOM);
            
            // Check if user is within any geofence
            this.checkGeofenceStatus(latitude, longitude);
            
            return position;
        } catch (error) {
            showError(`Location error: ${error.message}`);
            // Use default location if geolocation fails
            this.map.setView(CONFIG.DEFAULT_MAP_CENTER, CONFIG.DEFAULT_MAP_ZOOM);
        }
    }

    /**
     * Load offices data from the API and display on map
     */
    async loadOffices() {
        try {
            if (!AuthService.isAuthenticated()) {
                return;
            }
            
            const response = await fetch(`${CONFIG.API_URL}/offices`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${AuthService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load office locations');
            }
            
            const offices = await response.json();
            
            // Clear existing markers
            this.clearOfficeMarkers();
            
            // Add new markers for each office
            offices.forEach(office => {
                this.addOfficeMarker(office);
            });
            
            return offices;
        } catch (error) {
            console.error('Error loading offices:', error);
            showError(error.message);
        }
    }

    /**
     * Add an office marker to the map
     * @param {Object} office - The office data
     */
    addOfficeMarker(office) {
        // Create office marker
        const marker = L.marker([office.latitude, office.longitude], {
            icon: L.divIcon({
                className: 'office-location-marker',
                html: `<div style="background-color: ${CONFIG.OFFICE_MARKER_COLOR}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [15, 15],
                iconAnchor: [7.5, 7.5]
            })
        }).addTo(this.map);
        
        marker.bindPopup(`<b>${office.name}</b><br>${office.address}`);
        this.officeMarkers.push(marker);
        
        // Create geofence circle
        const circle = L.circle([office.latitude, office.longitude], {
            radius: office.radius,
            fillColor: CONFIG.GEOFENCE_COLOR,
            fillOpacity: CONFIG.GEOFENCE_OPACITY,
            color: CONFIG.GEOFENCE_COLOR,
            weight: 1
        }).addTo(this.map);
        
        // Store office data with the circle
        circle.office = office;
        this.geofenceCircles.push(circle);
    }

    /**
     * Clear all office markers from the map
     */
    clearOfficeMarkers() {
        // Remove markers
        this.officeMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.officeMarkers = [];
        
        // Remove geofence circles
        this.geofenceCircles.forEach(circle => {
            this.map.removeLayer(circle);
        });
        this.geofenceCircles = [];
    }

    /**
     * Check if user is within any geofence
     * @param {number} latitude - User's latitude
     * @param {number} longitude - User's longitude
     * @returns {Promise<Array>} Geofence status results
     */
    async checkGeofenceStatus(latitude, longitude) {
        try {
            if (!AuthService.isAuthenticated()) {
                return null;
            }
            
            const response = await fetch(`${CONFIG.API_URL}/attendance/check-location`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AuthService.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude,
                    longitude
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to check geofence status');
            }
            
            const results = await response.json();
            
            // Update UI based on results
            const withinGeofence = results.some(result => result.is_within_geofence);
            
            // Update check-in button state
            const checkInBtn = document.getElementById('check-in-btn');
            if (checkInBtn) {
                checkInBtn.disabled = !withinGeofence;
                checkInBtn.title = withinGeofence ? 
                    'Check in at this location' : 
                    'You must be within an office geofence to check in';
            }
            
            return results;
        } catch (error) {
            console.error('Error checking geofence status:', error);
            return null;
        }
    }

    /**
     * Get the nearest office to the user's location
     * @returns {Promise<Object>} The nearest office data
     */
    async getNearestOffice() {
        if (!this.currentPosition) {
            await this.locateUser();
            if (!this.currentPosition) {
                throw new Error('Unable to get your location');
            }
        }
        
        const { latitude, longitude } = this.currentPosition.coords;
        
        const results = await this.checkGeofenceStatus(latitude, longitude);
        if (!results || results.length === 0) {
            return null;
        }
        
        // Find the nearest office (minimum distance)
        const nearestOffice = results.reduce((nearest, current) => {
            return (!nearest || current.distance < nearest.distance) ? current : nearest;
        }, null);
        
        return nearestOffice;
    }
}

// Create a global instance of the location service
const locationService = new LocationService();

// DOM event listeners for location elements
document.addEventListener('DOMContentLoaded', () => {
    // Locate button
    document.getElementById('locate-btn').addEventListener('click', () => {
        locationService.locateUser();
    });
});