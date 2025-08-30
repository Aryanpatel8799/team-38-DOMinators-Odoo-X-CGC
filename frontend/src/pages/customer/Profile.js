import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  CameraIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePhone } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    type: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    try {
      // This would fetch user's vehicles from the API
      // For now, we'll use mock data
      setVehicles([]);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      // Update profile API call would go here
      toast.success('Profile updated successfully!');
      setEditing(false);
      // Update user context
      updateUser({ ...user, ...formData });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    if (!newVehicle.make.trim() || !newVehicle.model.trim() || !newVehicle.plate.trim()) {
      toast.error('Please fill in all required vehicle fields');
      return;
    }

    try {
      // Add vehicle API call would go here
      setVehicles([...vehicles, { ...newVehicle, _id: Date.now().toString() }]);
      setNewVehicle({
        type: 'car',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        color: ''
      });
      setShowAddVehicle(false);
      toast.success('Vehicle added successfully!');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    }
  };

  const handleRemoveVehicle = async (vehicleId) => {
    try {
      setVehicles(vehicles.filter(v => v._id !== vehicleId));
      toast.success('Vehicle removed successfully!');
    } catch (error) {
      console.error('Error removing vehicle:', error);
      toast.error('Failed to remove vehicle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-secondary-200 hover:bg-secondary-50">
              <CameraIcon className="w-4 h-4 text-secondary-600" />
            </button>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-secondary-900">{user?.name}</h1>
            <p className="text-secondary-600">{user?.email}</p>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Verified Customer
              </span>
            </div>
          </div>
          
          <Button
            variant={editing ? "outline" : "primary"}
            onClick={() => setEditing(!editing)}
            icon={<PencilIcon className="w-4 h-4" />}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-6">Personal Information</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<UserIcon className="w-5 h-5" />}
              required
            />
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<EnvelopeIcon className="w-5 h-5" />}
              required
            />
            
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<PhoneIcon className="w-5 h-5" />}
            />
            
            <Input
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!editing}
              icon={<MapPinIcon className="w-5 h-5" />}
            />
          </div>
          
          {editing && (
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Vehicles Section */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-secondary-900">My Vehicles</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddVehicle(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add Vehicle
          </Button>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-secondary-600 text-xl">🚗</span>
            </div>
            <h3 className="text-sm font-medium text-secondary-900">No vehicles added</h3>
            <p className="text-sm text-secondary-500 mt-1">
              Add your vehicles for faster service requests
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-secondary-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-secondary-600">
                      {vehicle.plate} • {vehicle.color} {vehicle.type}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveVehicle(vehicle._id)}
                    className="text-danger-600 hover:text-danger-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Vehicle Form */}
        {showAddVehicle && (
          <div className="mt-6 border-t border-secondary-200 pt-6">
            <h3 className="text-md font-medium text-secondary-900 mb-4">Add New Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    name="type"
                    value={newVehicle.type}
                    onChange={handleVehicleChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="truck">Truck</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
                
                <Input
                  label="Make"
                  name="make"
                  value={newVehicle.make}
                  onChange={handleVehicleChange}
                  placeholder="e.g., Toyota"
                  required
                />
                
                <Input
                  label="Model"
                  name="model"
                  value={newVehicle.model}
                  onChange={handleVehicleChange}
                  placeholder="e.g., Camry"
                  required
                />
                
                <Input
                  label="Year"
                  name="year"
                  type="number"
                  value={newVehicle.year}
                  onChange={handleVehicleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                
                <Input
                  label="License Plate"
                  name="plate"
                  value={newVehicle.plate}
                  onChange={handleVehicleChange}
                  placeholder="e.g., ABC-123"
                  required
                />
                
                <Input
                  label="Color"
                  name="color"
                  value={newVehicle.color}
                  onChange={handleVehicleChange}
                  placeholder="e.g., Red"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddVehicle(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add Vehicle
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
