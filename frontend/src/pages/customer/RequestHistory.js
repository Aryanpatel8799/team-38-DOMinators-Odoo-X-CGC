import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import RequestTracker from '../../components/customer/RequestTracker';
import PaymentModal from '../../components/payment/PaymentModal';
import requestService from '../../services/requestService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, getRelativeTime } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS, ISSUE_TYPE_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const RequestHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    issueType: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchRequests = useCallback(async () => {
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

      const response = await requestService.getMyRequests(queryParams);
      
      if (response.success) {
        setRequests(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.totalPages || 1,
          totalItems: response.data.totalItems || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching requests for:', user.email);
      fetchRequests();
    } else {
      console.log('No user found, cannot fetch requests');
    }
  }, [user, fetchRequests]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      issueType: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleTrackRequest = (request) => {
    setSelectedRequest(request);
    setShowTracker(true);
  };

  const handlePayment = (request) => {
    setSelectedRequest(request);
    setShowPaymentModal(true);
  };

  const handleStatusUpdate = (updatedData) => {
    setRequests(prev => prev.map(req => 
      req._id === updatedData.requestId 
        ? { ...req, status: updatedData.status }
        : req
    ));
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Payment completed successfully!');
    fetchRequests(); // Refresh the list
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'assigned':
      case 'enroute':
      case 'in_progress':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-primary-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      assigned: 'status-assigned',
      enroute: 'status-in-progress',
      in_progress: 'status-in-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return colors[status] || 'status-pending';
  };

  const canTrack = (status) => {
    return ['assigned', 'enroute', 'in_progress'].includes(status);
  };

  const canPay = (request) => {
    return request.status === 'completed' && request.quotation && !request.paymentCompleted;
  };

  if (showTracker && selectedRequest) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowTracker(false)}
          >
            ← Back to History
          </Button>
        </div>
        <RequestTracker 
          request={selectedRequest}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Request History</h1>
          <p className="text-secondary-600">
            Track and manage your service requests
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/customer/new-request')}
          icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
        >
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Request ID, vehicle..."
                className="pl-10 w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Issue Type
            </label>
            <select
              value={filters.issueType}
              onChange={(e) => handleFilterChange('issueType', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="flat_tire">Flat Tire</option>
              <option value="battery_dead">Dead Battery</option>
              <option value="engine_trouble">Engine Trouble</option>
              <option value="fuel_empty">Out of Fuel</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">
            Service Requests ({pagination.totalItems})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center">
            <WrenchScrewdriverIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No requests found</h3>
            <p className="text-secondary-600 mb-4">
              {Object.values(filters).some(filter => filter) 
                ? 'Try adjusting your filters to see more results.'
                : 'You haven\'t created any service requests yet.'
              }
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/customer/new-request')}
              icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
            >
              Create Your First Request
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {requests.map((request) => (
              <div key={request._id} className="p-6 hover:bg-secondary-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-secondary-900">
                          {ISSUE_TYPE_LABELS[request.issueType] || request.issueType}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {REQUEST_STATUS_LABELS[request.status]}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {request.location.address || 'Location provided'}
                        </div>
                        <div>
                          <strong>Vehicle:</strong> {request.vehicleInfo.model} ({request.vehicleInfo.plate})
                        </div>
                        <div>
                          <strong>Created:</strong> {getRelativeTime(request.createdAt)}
                        </div>
                      </div>

                      {request.description && (
                        <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}

                      {request.mechanic && (
                        <div className="mt-3 p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-secondary-900">
                                Assigned to: {request.mechanic.name}
                              </p>
                              <p className="text-xs text-secondary-600">
                                ⭐ {request.mechanic.rating?.toFixed(1) || 'New'} • {request.mechanic.phone}
                              </p>
                            </div>
                            {request.quotation && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-secondary-900">
                                  {formatCurrency(request.quotation)}
                                </p>
                                <p className="text-xs text-secondary-600">Estimated cost</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    {canTrack(request.status) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTrackRequest(request)}
                        icon={<EyeIcon className="h-4 w-4" />}
                      >
                        Track Live
                      </Button>
                    )}
                    
                    {canPay(request) && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handlePayment(request)}
                        icon={<CreditCardIcon className="h-4 w-4" />}
                      >
                        Pay Now
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrackRequest(request)}
                      icon={<EyeIcon className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRequest && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          serviceRequest={selectedRequest}
          amount={selectedRequest.quotation}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default RequestHistory;
