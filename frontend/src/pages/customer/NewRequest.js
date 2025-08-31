import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WrenchScrewdriverIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import MapLocationPicker from '../../components/common/MapLocationPicker';
import VehicleSelector from '../../components/customer/VehicleSelector';
import { useAuth } from '../../contexts/AuthContext';
import requestService from '../../services/requestService';
import toast from 'react-hot-toast';

const NewRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    urgency: 'medium',
    vehicleInfo: {
      type: 'car',
      model: '',
      plate: '',
      year: ''
    },
    location: {
      address: '',
      lat: null,
      lng: null
    },
    preferredTime: '',
    budget: '',
    images: []
  });

  const issueTypes = [
    { value: 'flat_tire', label: 'Flat Tire' },
    { value: 'battery_dead', label: 'Dead Battery' },
    { value: 'fuel_empty', label: 'Out of Fuel' },
    { value: 'engine_trouble', label: 'Engine Trouble' },
    { value: 'accident', label: 'Accident' },
    { value: 'key_locked', label: 'Keys Locked in Car' },
    { value: 'overheating', label: 'Engine Overheating' },
    { value: 'brake_failure', label: 'Brake Failure' },
    { value: 'transmission_issue', label: 'Transmission Issue' },
    { value: 'other', label: 'Other' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'emergency', label: 'Emergency' }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please enter manually.');
        }
      );
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLocationSelect = (location) => {
    console.log('Location selected:', location);
    setFormData(prev => ({
      ...prev,
      location: {
        address: location.address || `${location.lat}, ${location.lng}`,
        lat: location.lat,
        lng: location.lng
      }
    }));
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        color: vehicle.color || ''
      }
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      toast.error('Some files were invalid. Only images under 5MB are allowed.');
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.issueType) {
      toast.error('Please select an issue type');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return false;
    }
    if (!formData.vehicleInfo.type || !formData.vehicleInfo.make || !formData.vehicleInfo.model || !formData.vehicleInfo.plate || !formData.vehicleInfo.year) {
      toast.error('Please provide complete vehicle information');
      return false;
    }
    if (!formData.location.address || !formData.location.lat || !formData.location.lng) {
      toast.error('Please select a valid location');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('issueType', formData.issueType);
      submitData.append('description', formData.description);
      submitData.append('priority', formData.urgency); // Map urgency to priority
      submitData.append('vehicleInfo', JSON.stringify(formData.vehicleInfo));
      submitData.append('location', JSON.stringify(formData.location));
      submitData.append('preferredTime', formData.preferredTime);
      submitData.append('budget', formData.budget);
      submitData.append('broadcastRadius', '25'); // 25km radius
      submitData.append('broadcastToMechanics', 'true');

      // Add images
      formData.images.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      const response = await requestService.createRequest(submitData);
      
      if (response.success) {
        toast.success('Service request created and broadcasted to nearby mechanics!');
        navigate('/customer/requests');
      } else {
        toast.error(response.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create service request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <WrenchScrewdriverIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Service Request</h1>
            <p className="text-gray-600">Create a service request that will be broadcasted to mechanics within 25km</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Broadcast Service Request</h3>
              <p className="text-sm text-blue-800 mt-1">
                Your service request will be automatically sent to all verified mechanics within 25km of your location. 
                They will be notified and can accept your request.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        {/* Service Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type *
              </label>
              <Select
                value={formData.issueType}
                onChange={(e) => handleInputChange('issueType', e.target.value)}
                required
              >
                <option value="">Select issue type</option>
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <Select
                value={formData.urgency}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
              >
                {urgencyLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              required
            />
          </div>
        </div>

        {/* Vehicle Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
          
          {/* Vehicle Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Saved Vehicle (Optional)
            </label>
            <VehicleSelector
              selectedVehicle={selectedVehicle}
              onVehicleSelect={handleVehicleSelect}
              placeholder="Choose from your saved vehicles or add a new one"
              className="mb-4"
            />
          </div>

          {/* Manual Vehicle Input */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <Select
                value={formData.vehicleInfo.type}
                onChange={(e) => handleInputChange('vehicleInfo.type', e.target.value)}
                required
              >
                <option value="">Select vehicle type</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="truck">Truck</option>
                <option value="bus">Bus</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <Input
                value={formData.vehicleInfo.make || ''}
                onChange={(e) => handleInputChange('vehicleInfo.make', e.target.value)}
                placeholder="e.g., Honda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <Input
                value={formData.vehicleInfo.model}
                onChange={(e) => handleInputChange('vehicleInfo.model', e.target.value)}
                placeholder="e.g., City"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <Input
                value={formData.vehicleInfo.plate}
                onChange={(e) => handleInputChange('vehicleInfo.plate', e.target.value)}
                placeholder="e.g., MH12AB1234"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <Input
                type="number"
                value={formData.vehicleInfo.year}
                onChange={(e) => handleInputChange('vehicleInfo.year', e.target.value)}
                placeholder="e.g., 2020"
                min="1990"
                max={new Date().getFullYear()}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <Input
                value={formData.vehicleInfo.color || ''}
                onChange={(e) => handleInputChange('vehicleInfo.color', e.target.value)}
                placeholder="e.g., White"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h2>
          <div className="space-y-4">
            <MapLocationPicker
              onLocationSelect={handleLocationSelect}
              userLocation={userLocation}
              placeholder="Select service location"
            />
            {formData.location.address && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4" />
                <span>{formData.location.address}</span>
              </div>
            )}
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> Location selected: {formData.location.address ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time
              </label>
              <Input
                type="datetime-local"
                value={formData.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (Optional)
              </label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="e.g., 1000"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images (Optional)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload images of the issue (max 5MB each, up to 5 images)
              </p>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/customer/requests')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={<CheckCircleIcon className="h-4 w-4" />}
          >
            Broadcast Request
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewRequest;
