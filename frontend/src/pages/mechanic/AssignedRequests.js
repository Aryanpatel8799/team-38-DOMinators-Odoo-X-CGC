import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import requestService from '../../services/requestService';
import { formatDate, formatDistance } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AssignedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptFormData, setAcceptFormData] = useState({
    estimatedArrival: 30,
    quotation: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  const fetchAssignedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      };

      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });

      const response = await requestService.getAssignedRequests(queryParams);
      
      if (response.success) {
        setRequests(response.data.requests || []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching assigned requests:', error);
      toast.error('Failed to load assigned requests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchAssignedRequests();
  }, [fetchAssignedRequests]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await requestService.updateRequestStatus(requestId, newStatus);
      
      if (response.success) {
        toast.success(`Request ${newStatus} successfully`);
        fetchAssignedRequests(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update request status';
      toast.error(errorMessage);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await requestService.acceptRequest(requestId, acceptFormData);
      if (response.success) {
        toast.success('Request accepted successfully');
        setShowAcceptModal(false);
        setAcceptFormData({ estimatedArrival: 30, quotation: '' });
        fetchAssignedRequests();
      } else {
        toast.error(response.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const openAcceptModal = (request) => {
    setSelectedRequest(request);
    setShowAcceptModal(true);
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      const response = await requestService.rejectRequest(requestId, { reason });
      if (response.success) {
        toast.success('Request rejected successfully');
        fetchAssignedRequests();
      } else {
        toast.error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'enroute': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'assigned': return <CheckCircleIcon className="w-4 h-4" />;
      case 'enroute': return <TruckIcon className="w-4 h-4" />;
      case 'in_progress': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'completed': return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">Assigned Requests</h1>
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="enroute">En Route</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="text"
              placeholder="Search requests..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned requests</h3>
            <p className="text-gray-500">You don't have any assigned service requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">#{request._id.slice(-8)}</span>
                      {request.mechanicId && (request.status === 'pending' || request.status === 'assigned') && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Direct Booking
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.issueType.replace('_', ' ').toUpperCase()}
                    </h3>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{request.location.address || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      {request.quotation && (
                        <div className="font-medium text-green-600">
                          ₹{request.quotation}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </Button>
                    
                    {request.status === 'pending' && request.mechanicId && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAcceptModal(request)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectRequest(request._id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {request.status === 'assigned' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusUpdate(request._id, 'enroute')}
                      >
                        Start Journey
                      </Button>
                    )}
                    
                    {request.status === 'enroute' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusUpdate(request._id, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    
                    {request.status === 'in_progress' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleStatusUpdate(request._id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Accept Request Modal */}
      {showAcceptModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accept Service Request</h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Customer Details:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Name:</strong> {selectedRequest.customerId?.name || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedRequest.customerId?.phone || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedRequest.customerId?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Service Location:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p>{selectedRequest.location.address || 'Address not specified'}</p>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.location.lat}, {selectedRequest.location.lng}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Service Details:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Issue:</strong> {selectedRequest.issueType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Vehicle:</strong> {selectedRequest.vehicleInfo.type} - {selectedRequest.vehicleInfo.model}</p>
                  <p><strong>Plate:</strong> {selectedRequest.vehicleInfo.plate}</p>
                  <p><strong>Description:</strong> {selectedRequest.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Arrival Time (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={acceptFormData.estimatedArrival}
                  onChange={(e) => setAcceptFormData(prev => ({ ...prev, estimatedArrival: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="30"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Quotation (₹) - Optional
                </label>
                <input
                  type="number"
                  min="0"
                  value={acceptFormData.quotation}
                  onChange={(e) => setAcceptFormData(prev => ({ ...prev, quotation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Leave empty for AI-generated quotation"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAcceptModal(false);
                    setAcceptFormData({ estimatedArrival: 30, quotation: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleAcceptRequest(selectedRequest._id)}
                >
                  Accept Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Request Details Modal Component
const RequestDetailsModal = ({ request, onClose, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusUpdate(request._id, newStatus);
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Service Request Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request ID
                    </label>
                    <p className="text-sm text-gray-900">#{request._id.slice(-8)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Type
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {request.issueType.replace('_', ' ')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">{request.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer
                    </label>
                    <p className="text-sm text-gray-900">
                      {request.customerId?.name || 'Customer name not available'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {request.customerId?.phone || 'Phone not available'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="text-sm text-gray-900">
                        <p>{request.location.address || 'Address not specified'}</p>
                        <p className="text-gray-500">
                          {request.location.lat}, {request.location.lng}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Information
                    </label>
                    <div className="text-sm text-gray-900">
                      <p>{request.vehicleInfo.type} - {request.vehicleInfo.model}</p>
                      <p>Plate: {request.vehicleInfo.plate}</p>
                      {request.vehicleInfo.year && <p>Year: {request.vehicleInfo.year}</p>}
                    </div>
                  </div>

                  {request.quotation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quotation
                      </label>
                      <p className="text-lg font-semibold text-green-600">₹{request.quotation}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {request.status === 'assigned' && (
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate('enroute')}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Start Journey
              </Button>
            )}
            
            {request.status === 'enroute' && (
              <Button
                variant="primary"
                onClick={() => handleStatusUpdate('in_progress')}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Start Work
              </Button>
            )}
            
            {request.status === 'in_progress' && (
              <Button
                variant="success"
                onClick={() => handleStatusUpdate('completed')}
                loading={updating}
                disabled={updating}
                className="ml-3"
              >
                Complete Request
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updating}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedRequests;
