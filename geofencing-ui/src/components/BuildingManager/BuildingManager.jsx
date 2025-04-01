import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Logger from '../../utils/logger';
import './BuildingManager.css';

/**
 * Component for managing predefined buildings
 */
const BuildingManager = ({ onBuildingSelect }) => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  
  // Form state for creating/editing buildings
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    category: '',
    geofence_radius_meters: 100
  });
  
  // Fetch buildings on component mount
  useEffect(() => {
    fetchBuildings();
  }, []);
  
  // Fetch all buildings from the API
  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getBuildings();
      setBuildings(response.buildings);
      
      setLoading(false);
    } catch (error) {
      Logger.error('Error fetching buildings: {0}', error.message);
      setError('Failed to load buildings. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle building selection
  const handleBuildingSelect = (buildingId) => {
    setSelectedBuildingId(buildingId);
    
    if (onBuildingSelect) {
      onBuildingSelect(buildingId);
    }
    
    Logger.info('Selected building: {0}', buildingId);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'geofence_radius_meters' ? parseFloat(value) : value
    });
  };
  
  // Handle coordinate input changes with validation
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    
    // Allow empty strings for editing
    if (value === '') {
      setFormData({
        ...formData,
        [name]: value
      });
      return;
    }
    
    // Validate and parse coordinates
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      // Apply range limits
      let limitedValue = floatValue;
      if (name === 'latitude' && (floatValue < -90 || floatValue > 90)) {
        limitedValue = Math.max(-90, Math.min(90, floatValue));
      } else if (name === 'longitude' && (floatValue < -180 || floatValue > 180)) {
        limitedValue = Math.max(-180, Math.min(180, floatValue));
      }
      
      setFormData({
        ...formData,
        [name]: limitedValue
      });
    }
  };
  
  // Show form for creating a new building
  const showCreateForm = () => {
    setFormData({
      name: '',
      latitude: '',
      longitude: '',
      address: '',
      category: '',
      geofence_radius_meters: 100
    });
    setIsEditing(false);
    setShowForm(true);
  };
  
  // Show form for editing an existing building
  const showEditForm = (building) => {
    setFormData({
      name: building.name,
      latitude: building.coordinates.latitude,
      longitude: building.coordinates.longitude,
      address: building.address || '',
      category: building.category || '',
      geofence_radius_meters: building.geofence_radius_meters
    });
    setIsEditing(true);
    setShowForm(true);
    setSelectedBuildingId(building.id);
  };
  
  // Submit form to create or update a building
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate coordinates
      const lat = parseFloat(formData.latitude);
      const lon = parseFloat(formData.longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        setError('Latitude and longitude must be valid numbers');
        setLoading(false);
        return;
      }
      
      // Prepare data for API
      const buildingData = {
        name: formData.name,
        latitude: lat,
        longitude: lon,
        address: formData.address || undefined,
        category: formData.category || undefined,
        geofence_radius_meters: formData.geofence_radius_meters
      };
      
      if (isEditing) {
        // Update existing building
        await apiService.updateBuilding(selectedBuildingId, buildingData);
        Logger.info('Updated building: {0}', selectedBuildingId);
      } else {
        // Create new building
        const response = await apiService.createBuilding(buildingData);
        Logger.info('Created new building: {0}', response.building.id);
      }
      
      // Refresh buildings list and close form
      await fetchBuildings();
      setShowForm(false);
      setLoading(false);
      
    } catch (error) {
      Logger.error('Error saving building: {0}', error.message);
      setError('Failed to save building. Please try again.');
      setLoading(false);
    }
  };
  
  // Delete a building
  const handleDeleteBuilding = async (buildingId) => {
    if (!window.confirm('Are you sure you want to delete this building?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await apiService.deleteBuilding(buildingId);
      Logger.info('Deleted building: {0}', buildingId);
      
      // If the deleted building was selected, clear selection
      if (selectedBuildingId === buildingId) {
        setSelectedBuildingId(null);
        if (onBuildingSelect) {
          onBuildingSelect(null);
        }
      }
      
      // Refresh buildings list
      await fetchBuildings();
      setLoading(false);
      
    } catch (error) {
      Logger.error('Error deleting building: {0}', error.message);
      setError('Failed to delete building. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="building-manager">
      <div className="manager-header">
        <h2>Predefined Buildings</h2>
        <button 
          className="create-button" 
          onClick={showCreateForm}
          disabled={loading}
        >
          Add Building
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-message">Loading...</div>
      ) : (
        <div className="buildings-list">
          {buildings.length === 0 ? (
            <div className="no-buildings">No buildings defined yet. Click "Add Building" to create one.</div>
          ) : (
            buildings.map((building) => (
              <div 
                key={building.id} 
                className={`building-item ${selectedBuildingId === building.id ? 'selected' : ''}`}
                onClick={() => handleBuildingSelect(building.id)}
              >
                <div className="building-info">
                  <h3>{building.name}</h3>
                  <p className="building-coords">
                    ({building.coordinates.latitude.toFixed(6)}, {building.coordinates.longitude.toFixed(6)})
                  </p>
                  <p>Geofence radius: {building.geofence_radius_meters}m</p>
                  {building.address && <p>Address: {building.address}</p>}
                </div>
                <div className="building-actions">
                  <button 
                    className="edit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      showEditForm(building);
                    }}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuilding(building.id);
                    }}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {showForm && (
        <div className="form-overlay">
          <div className="building-form">
            <h3>{isEditing ? 'Edit Building' : 'Add New Building'}</h3>
            
            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label htmlFor="name">Building Name*</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="latitude">Latitude*</label>
                <input
                  id="latitude"
                  name="latitude"
                  type="text"
                  value={formData.latitude}
                  onChange={handleCoordinateChange}
                  required
                  placeholder="-90 to 90"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="longitude">Longitude*</label>
                <input
                  id="longitude"
                  name="longitude"
                  type="text"
                  value={formData.longitude}
                  onChange={handleCoordinateChange}
                  required
                  placeholder="-180 to 180"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="geofence_radius_meters">Geofence Radius (meters)*</label>
                <input
                  id="geofence_radius_meters"
                  name="geofence_radius_meters"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.geofence_radius_meters}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., office, school, park"
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {isEditing ? 'Update Building' : 'Create Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingManager;