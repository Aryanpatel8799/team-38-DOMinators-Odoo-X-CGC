import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, PlusIcon, TruckIcon } from '@heroicons/react/24/outline';
import customerApi from '../../api/customerApi';
import toast from 'react-hot-toast';

const VehicleSelector = ({ 
  selectedVehicle, 
  onVehicleSelect, 
  showAddOption = true,
  placeholder = "Select a vehicle",
  className = ""
}) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle) => {
    onVehicleSelect(vehicle);
    setIsOpen(false);
  };

  const getVehicleDisplayName = (vehicle) => {
    return `${vehicle.name} (${vehicle.make} ${vehicle.model} - ${vehicle.plate})`;
  };

  const getVehicleTypeIcon = (type) => {
    return <TruckIcon className="h-4 w-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedVehicle ? (
              <>
                {getVehicleTypeIcon(selectedVehicle.type)}
                <span className="text-sm">
                  {getVehicleDisplayName(selectedVehicle)}
                </span>
                {selectedVehicle.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Default
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No vehicles saved
              {showAddOption && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to vehicle management page
                      window.location.href = '/customer/vehicles';
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Add a vehicle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getVehicleTypeIcon(vehicle.type)}
                      <div>
                        <div className="font-medium text-sm">
                          {vehicle.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.plate}
                        </div>
                      </div>
                    </div>
                    {vehicle.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {showAddOption && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to vehicle management page
                      window.location.href = '/customer/vehicles';
                    }}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium w-full"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add New Vehicle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VehicleSelector;
