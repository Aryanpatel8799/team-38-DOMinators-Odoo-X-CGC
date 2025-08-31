import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  WrenchScrewdriverIcon, 
  PhotoIcon, 
  MapPinIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  StarIcon,
  PhoneIcon,
  ClockIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import MapLocationPicker from '../../components/common/MapLocationPicker';
import requestService from '../../services/requestService';
import customerApi from '../../api/customerApi';
import { useAuth } from '../../contexts/AuthContext';
import { ISSUE_TYPES, ISSUE_TYPE_LABELS, PRIORITY_LEVELS, PRIORITY_LABELS, VEHICLE_TYPES, VEHICLE_TYPE_LABELS } from '../../utils/constants';
import { validateRequired } from '../../utils/helpers';
import toast from 'react-hot-toast';

const BookService = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [loadingMechanic, setLoadingMechanic] = useState(true);
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    vehicleInfo: {
      type: '',
      model: '',
      plate: '',
      year: new Date().getFullYear()
    },
    location: null,
    priority: searchParams.get('priority') || 'medium',
    images: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicleName, setSelectedVehicleName] = useState('');
  
  console.log('BookService component loaded');
  console.log('Search params:', searchParams.toString());
  
  useEffect(() => {
    // Load mechanic details if mechanicId is provided
    const mechanicId = searchParams.get('mechanicId');
    console.log('Mechanic ID from params:', mechanicId);
    
    if (mechanicId) {
      // Validate mechanicId format
      if (!mechanicId.match(/^[0-9a-fA-F]{24}$/)) {
        toast.error('Invalid mechanic ID format');
        navigate('/customer/mechanics');
        return;
      }
      loadMechanicDetails(mechanicId);
    } else {
      setLoadingMechanic(false);
      // If no mechanicId is provided, redirect to mechanic discovery
      toast.error('No mechanic selected. Please select a mechanic first.');
      navigate('/customer/mechanics');
    }

    // Fetch user's vehicles
    fetchVehicles();
  }, [searchParams, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showVehicleDropdown && !event.target.closest('.vehicle-dropdown')) {
        setShowVehicleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVehicleDropdown]);

  // Add error boundary after hooks
  if (!user) {
    console.error('User not found in BookService');
    return <div>Loading...</div>;
  }

  const loadMechanicDetails = async (mechanicId) => {
    try {
      setLoadingMechanic(true);
      console.log('Loading mechanic details for ID:', mechanicId);
      const response = await customerApi.getMechanicDetails(mechanicId);
      console.log('Mechanic details response:', response);
      
      if (response.success) {
        setSelectedMechanic(response.data);
      } else {
        toast.error('Failed to load mechanic details');
        navigate('/customer/mechanics');
      }
    } catch (error) {
      console.error('Error loading mechanic details:', error);
      toast.error('Failed to load mechanic details');
      navigate('/customer/mechanics');
    } finally {
      setLoadingMechanic(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await customerApi.getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        type: vehicle.type,
        model: `${vehicle.make} ${vehicle.model}`.trim(),
        plate: vehicle.plate,
        year: vehicle.year
      }
    }));
    setSelectedVehicleName(vehicle.name);
    setShowVehicleDropdown(false);
    toast.success(`Selected vehicle: ${vehicle.name}`);
  };

  const handleAddNewVehicle = () => {
    setShowVehicleDropdown(false);
    setSelectedVehicleName('');
    // Clear the form to allow manual entry
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        type: '',
        model: '',
        plate: '',
        year: new Date().getFullYear()
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
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
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationSelect = (location) => {
    // Ensure location always has an address field
    const locationWithAddress = {
      ...location,
      address: location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    };
    
    setFormData(prev => ({
      ...prev,
      location: locationWithAddress
    }));
    
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image type`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 5MB)`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    console.log('Validating form data:', formData);

    if (!formData.issueType) {
      newErrors.issueType = 'Please select an issue type';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.vehicleInfo.type) {
      newErrors['vehicleInfo.type'] = 'Please select vehicle type';
    }

    if (!formData.vehicleInfo.model || formData.vehicleInfo.model.trim().length < 2) {
      newErrors['vehicleInfo.model'] = 'Please enter a valid vehicle model';
    }

    if (!formData.vehicleInfo.plate || formData.vehicleInfo.plate.trim().length < 3) {
      newErrors['vehicleInfo.plate'] = 'Please enter a valid license plate';
    }

    if (!formData.location) {
      newErrors.location = 'Please select your location';
    } else if (!formData.location.lat || !formData.location.lng) {
      newErrors.location = 'Please select a valid location on the map';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form data before validation:', JSON.stringify(formData, null, 2));

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!selectedMechanic) {
      toast.error('No mechanic selected');
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      let imageUrls = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        try {
          const uploadResponse = await requestService.uploadImages(imageFiles);
          if (uploadResponse.success) {
            imageUrls = uploadResponse.data.urls;
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast.warning('Failed to upload some images, continuing without them');
        } finally {
          setUploadingImages(false);
        }
      }

      // Create service request with specific mechanic
      const requestData = {
        ...formData,
        images: imageUrls,
        mechanicId: selectedMechanic._id, // Direct booking to specific mechanic
        isDirectBooking: true // Flag to indicate this is a direct booking
      };

      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

      const response = await requestService.createRequest(requestData);

      if (response.success) {
        toast.success('Service request sent to mechanic successfully!');
        navigate(`/customer/requests/${response.data.request._id}`);
      } else {
        toast.error(response.message || 'Failed to create service request');
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error('Failed to create service request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  if (loadingMechanic) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Book Service</h1>
              <p className="text-secondary-600">Send a direct service request to the selected mechanic</p>
            </div>
            <div className="flex items-center space-x-2">
              <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading mechanic details...</p>
              <p className="text-sm text-secondary-500 mt-1">Please wait while we fetch the mechanic information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Book Service</h1>
            <p className="text-secondary-600">Send a direct service request to the selected mechanic</p>
          </div>
          <div className="flex items-center space-x-2">
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        {selectedMechanic ? (
          <div className="bg-secondary-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900">{selectedMechanic.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-secondary-600">
                    <div className="flex items-center">
                      {getRatingStars(selectedMechanic.rating || 0)}
                      <span className="ml-1">({selectedMechanic.rating?.toFixed(1) || 'N/A'})</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{selectedMechanic.location?.address || 'Location not available'}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span>{selectedMechanic.phone || 'Phone not available'}</span>
                    </div>
                    {selectedMechanic.specialties && selectedMechanic.specialties.length > 0 && (
                      <div className="flex items-center">
                        <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                        <span>{selectedMechanic.specialties.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Direct Booking
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/customer/mechanics')}
                >
                  Change Mechanic
                </Button>
              </div>
            </div>
            
            {/* Additional Mechanic Info */}
            {selectedMechanic.reviews && selectedMechanic.reviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Reviews</h4>
                <div className="space-y-2">
                  {selectedMechanic.reviews.slice(0, 2).map((review, index) => (
                    <div key={index} className="bg-white rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                        <div className="flex items-center">
                          {getRatingStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-800">Mechanic details not found</span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate('/customer/mechanics')}
              >
                Find Mechanic
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Service Request Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Issue Type Selection */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center">
            <WrenchScrewdriverIcon className="h-6 w-6 mr-2 text-primary-600" />
            What's the problem?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {Object.entries(ISSUE_TYPES).map(([key, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, issueType: value }))}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.issueType === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-300 hover:border-secondary-400 text-secondary-700'
                }`}
              >
                <div className="font-medium">{ISSUE_TYPE_LABELS[value]}</div>
              </button>
            ))}
          </div>
          
          {errors.issueType && (
            <p className="text-danger-600 text-sm">{errors.issueType}</p>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Describe the Issue</h2>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Please provide a detailed description of the problem..."
            className={`w-full p-3 border rounded-lg resize-none ${
              errors.description ? 'border-danger-500' : 'border-secondary-300'
            }`}
            rows={4}
          />
          {errors.description && (
            <p className="text-danger-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Vehicle Information</h2>
          
          {/* Vehicle Selector Dropdown */}
          {vehicles.length > 0 ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select from your vehicles
              </label>
              <div className="relative vehicle-dropdown">
                <button
                  type="button"
                  onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-secondary-300 rounded-lg bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <span className="text-secondary-900">
                    {loadingVehicles ? 'Loading vehicles...' : 
                     selectedVehicleName ? `Selected: ${selectedVehicleName}` : 'Choose a vehicle from your profile'}
                  </span>
                  <ChevronDownIcon className={`h-5 w-5 text-secondary-400 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showVehicleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {vehicles.map((vehicle) => (
                      <button
                        key={vehicle._id}
                        type="button"
                        onClick={() => handleVehicleSelect(vehicle)}
                        className="w-full px-4 py-3 text-left hover:bg-secondary-50 border-b border-secondary-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-secondary-900">{vehicle.name}</p>
                            <p className="text-sm text-secondary-600">
                              {vehicle.make} {vehicle.model} • {vehicle.plate}
                            </p>
                          </div>
                          <div className="text-xs text-secondary-500">
                            {vehicle.type}
                          </div>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddNewVehicle}
                      className="w-full px-4 py-3 text-left hover:bg-secondary-50 border-t border-secondary-200 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2 text-primary-600" />
                      <span className="text-primary-600 font-medium">Add new vehicle</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-secondary-500 mt-1">
                Select a vehicle from your profile or add a new one below
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center">
                    <span className="text-secondary-600 text-sm">🚗</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-secondary-900">No vehicles in your profile</p>
                  <p className="text-sm text-secondary-600">
                    You can add vehicles to your profile for faster booking. Enter vehicle details below or{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/customer/profile')}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      manage your vehicles
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Vehicle Type *
              </label>
              <select
                name="vehicleInfo.type"
                value={formData.vehicleInfo.type}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg ${
                  errors['vehicleInfo.type'] ? 'border-danger-500' : 'border-secondary-300'
                }`}
              >
                <option value="">Select vehicle type</option>
                {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                  <option key={value} value={value}>
                    {VEHICLE_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
              {errors['vehicleInfo.type'] && (
                <p className="text-danger-600 text-sm mt-1">{errors['vehicleInfo.type']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                name="vehicleInfo.model"
                value={formData.vehicleInfo.model}
                onChange={handleInputChange}
                placeholder="e.g., Honda City, Maruti Swift"
                className={`w-full p-3 border rounded-lg ${
                  errors['vehicleInfo.model'] ? 'border-danger-500' : 'border-secondary-300'
                }`}
              />
              {errors['vehicleInfo.model'] && (
                <p className="text-danger-600 text-sm mt-1">{errors['vehicleInfo.model']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                License Plate *
              </label>
              <input
                type="text"
                name="vehicleInfo.plate"
                value={formData.vehicleInfo.plate}
                onChange={handleInputChange}
                placeholder="e.g., DL01AB1234"
                className={`w-full p-3 border rounded-lg ${
                  errors['vehicleInfo.plate'] ? 'border-danger-500' : 'border-secondary-300'
                }`}
              />
              {errors['vehicleInfo.plate'] && (
                <p className="text-danger-600 text-sm mt-1">{errors['vehicleInfo.plate']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Year
              </label>
              <input
                type="number"
                name="vehicleInfo.year"
                value={formData.vehicleInfo.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full p-3 border border-secondary-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Location Selection */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center">
            <MapPinIcon className="h-6 w-6 mr-2 text-primary-600" />
            Service Location
          </h2>
          
          <MapLocationPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={formData.location}
            height="400px"
            className="h-64 rounded-lg overflow-hidden"
          />
          
          {errors.location && (
            <p className="text-danger-600 text-sm mt-2">{errors.location}</p>
          )}
        </div>

        {/* Priority Selection */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">Priority Level</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: value }))}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.priority === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-300 hover:border-secondary-400 text-secondary-700'
                }`}
              >
                <div className="font-medium">{PRIORITY_LABELS[value]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center">
            <PhotoIcon className="h-6 w-6 mr-2 text-primary-600" />
            Upload Photos (Optional)
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <PhotoIcon className="h-12 w-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600">
                  Click to upload images or drag and drop
                </p>
                <p className="text-sm text-secondary-500 mt-1">
                  PNG, JPG, GIF up to 5MB each (max 5 images)
                </p>
              </label>
            </div>

            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/customer/mechanics')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                issueType: 'flat_tire',
                description: 'My car has a flat tire and I need assistance to change it.',
                vehicleInfo: {
                  type: 'car',
                  model: 'Honda City',
                  plate: 'DL01AB1234',
                  year: 2020
                },
                location: {
                  lat: 28.6139,
                  lng: 77.2090,
                  address: 'Delhi, India'
                },
                priority: 'medium',
                images: []
              });
              toast.success('Form pre-filled for testing');
            }}
            disabled={loading}
          >
            Pre-fill Form
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading || uploadingImages}
            disabled={loading || uploadingImages}
          >
            {loading || uploadingImages ? 'Sending Request...' : 'Send Request to Mechanic'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookService;
