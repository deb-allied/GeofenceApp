import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import config from '../../config';
import Logger from '../../utils/logger';
import './Map.css';

// Fix for Leaflet marker icons
// This is needed because Leaflet expects the marker icons to be in a specific location
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icon for buildings
const buildingIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker icon for buildings within geofence
const buildingWithinGeofenceIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'building-within-geofence-icon', // Custom class to apply color in CSS
});

/**
 * Component to automatically update the map view based on user location
 */
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      Logger.debug('Updating map view to: {0}, {1}, zoom: {2}', center[0], center[1], zoom);
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

/**
 * Map component for displaying user location and nearby buildings
 */
const Map = ({ 
  userLocation, 
  buildings = [], 
  radiusMeters = config.geofence.defaultRadiusMeters,
  geofenceResponse = null,
  onMapClick = null,
}) => {
  const [mapCenter, setMapCenter] = useState([
    config.map.defaultCenter.latitude,
    config.map.defaultCenter.longitude,
  ]);
  const [mapZoom, setMapZoom] = useState(config.map.defaultZoom);
  
  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);
  
  // Handle map click event
  const handleMapClick = (e) => {
    if (onMapClick) {
      const { lat, lng } = e.latlng;
      onMapClick({ latitude: lat, longitude: lng });
    }
  };

  return (
    <div className="map-container">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          map.on('click', handleMapClick);
        }}
      >
        <TileLayer
          attribution={config.map.attribution}
          url={config.map.tileLayer}
          maxZoom={config.map.maxZoom}
        />
        
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* User location marker */}
        {userLocation && (
          <>
            <Marker position={[userLocation.latitude, userLocation.longitude]}>
              <Popup>
                <div>
                  <h3>Your Location</h3>
                  <p>Lat: {userLocation.latitude.toFixed(6)}</p>
                  <p>Lng: {userLocation.longitude.toFixed(6)}</p>
                  {userLocation.accuracy && (
                    <p>Accuracy: ±{Math.round(userLocation.accuracy)}m</p>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Geofence circle around user */}
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={radiusMeters}
              pathOptions={{
                color: config.geofence.geofenceCircleColor,
                fillColor: config.geofence.geofenceCircleColor,
                fillOpacity: config.geofence.geofenceCircleOpacity,
              }}
            />
          </>
        )}
        
        {/* Building markers */}
        {geofenceResponse && geofenceResponse.buildings_within_geofence.map((status) => {
          const building = status.building;
          const isWithinGeofence = status.is_within_geofence;
          
          return (
            <Marker
              key={building.id}
              position={[building.coordinates.latitude, building.coordinates.longitude]}
              icon={isWithinGeofence ? buildingWithinGeofenceIcon : buildingIcon}
            >
              <Popup>
                <div>
                  <h3>{building.name || 'Building'}</h3>
                  <p>ID: {building.id}</p>
                  {building.address && <p>Address: {building.address}</p>}
                  {building.category && <p>Category: {building.category}</p>}
                  <p>Distance: {Math.round(status.distance_meters)}m</p>
                  <p>
                    <strong>
                      Status: {isWithinGeofence 
                        ? 'Within geofence' 
                        : 'Outside geofence'}
                    </strong>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;