import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import VerificationForm from '../../components/mechanic/VerificationForm';
import NavigationModal from '../../components/mechanic/NavigationModal';
import mechanicApi from '../../api/mechanicApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';
import socketService from '../../services/socketService';

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [verification, setVerification] = useState(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkVerificationStatus();
    setupSocketListeners();
    
    return () => {
      // Cleanup socket listeners
      socketService.off('new-request-available');
      socketService.off('request-taken');
    };
  }, []);

  const setupSocketListeners = () => {
    // Join mechanic area for receiving broadcast requests
    if (user && user._id && user.location) {
      socketService.joinMechanicArea(user._id, user.location);
    }

    // Listen for new available requests
    socketService.onNewRequestAvailable((requestData) => {
      console.log('New request available:', requestData);
      toast.success(`New ${requestData.issueType} request available nearby!`);
      // Refresh dashboard data to show new request
      fetchDashboardData();
    });

    // Listen for requests taken by other mechanics
    socketService.onRequestTaken((data) => {
      console.log('Request taken by another mechanic:', data);
      // Refresh dashboard data
      fetchDashboardData();
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching dashboard data...');
      
      // Fetch assigned requests and stats (including available broadcast requests)
      const [requestsResponse, statsResponse] = await Promise.all([
        mechanicApi.getAssignedRequests({ limit: 5, page: 1 }), // Temporarily disable includeAvailable
        mechanicApi.getStats()
      ]);
      
      console.log('Requests response:', requestsResponse);
      console.log('Stats response:', statsResponse);
      
      if (requestsResponse.success) {
        const requestsData = requestsResponse.data.items || requestsResponse.data.requests || [];
        console.log('Setting requests:', requestsData);
        setRequests(requestsData);
      } else {
        console.error('Requests response not successful:', requestsResponse);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      } else {
        console.error('Stats response not successful:', statsResponse);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await mechanicApi.getVerificationStatus();
      if (response.success && response.data.verification) {
        setVerification(response.data.verification);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const handleVerificationSuccess = () => {
    setShowVerificationForm(false);
    checkVerificationStatus();
    toast.success('Verification submitted successfully!');
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

  const getVerificationStatusDisplay = () => {
    if (!verification) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Verification Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need to complete your shop verification to start receiving service requests.
              </p>
              <Button
                onClick={() => setShowVerificationForm(true)}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                Start Verification
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const statusConfig = {
      pending: {
        icon: <ClockIcon className="h-6 w-6 text-warning-500" />,
        color: 'text-warning-600',
        bgColor: 'bg-warning-50',
        borderColor: 'border-warning-200',
        title: 'Verification Pending',
        description: 'Your verification request is under review. You can still view requests but cannot accept them yet.'
      },
      approved: {
        icon: <CheckCircleIcon className="h-6 w-6 text-success-500" />,
        color: 'text-success-600',
        bgColor: 'bg-success-50',
        borderColor: 'border-success-200',
        title: 'Verification Approved',
        description: 'Your account is verified! You can now accept and complete service requests.'
      },
      rejected: {
        icon: <XCircleIcon className="h-6 w-6 text-danger-500" />,
        color: 'text-danger-600',
        bgColor: 'bg-danger-50',
        borderColor: 'border-danger-200',
        title: 'Verification Rejected',
        description: verification.rejectionReason || 'Your verification request was not approved. Please submit a new one.'
      }
    };

    const config = statusConfig[verification.status];
    
    return (
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
        <div className="flex items-start space-x-3">
          {config.icon}
          <div className="flex-1">
            <h3 className={`font-medium ${config.color}`}>{config.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            {verification.status === 'rejected' && (
              <Button
                onClick={() => setShowVerificationForm(true)}
                variant="primary"
                size="sm"
                className="mt-3"
              >
                Submit New Verification
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-white p-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-primary-100 text-lg">
            Ready to help customers with their vehicle issues? Let's get started!
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Online & Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">Last active: Just now</span>
            </div>
            <Link to="/mechanic/chat">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                View Messages
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
      </div>

      {/* Verification Status */}
      {getVerificationStatusDisplay()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRequests}</p>
              <p className="text-xs text-green-600 mt-1">+12% this month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Requests</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeRequests}</p>
              <p className="text-xs text-orange-600 mt-1">Currently working</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedRequests}</p>
              <p className="text-xs text-green-600 mt-1">98% success rate</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              <p className="text-xs text-green-600 mt-1">+₹2,450 this week</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Requests</h2>
            <Link
              to="/mechanic/requests"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {verification?.status === 'approved' 
                ? 'You\'ll see service requests here when they become available.'
                : 'Complete your verification to start receiving requests.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {REQUEST_STATUS_LABELS[request.issueType] || request.issueType}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {REQUEST_STATUS_LABELS[request.status]}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {request.location.address || 'Location provided'}
                        </div>
                        <div>
                          <strong>Vehicle:</strong> {request.vehicleInfo.model} ({request.vehicleInfo.plate})
                        </div>
                        <div>
                          <strong>Created:</strong> {formatDate(request.createdAt)}
                        </div>
                      </div>

                      {request.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {request.description}
                        </p>
                      )}

                      {request.quotation && (
                        <div className="mt-2 text-sm">
                          <strong>Quotation:</strong> {formatCurrency(request.quotation)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <Link
                      to={`/mechanic/requests/${request._id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      View Details
                    </Link>
                    {(request.status === 'assigned' || request.status === 'enroute') && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowNavigationModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                        Navigate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/mechanic/requests"
            className="group flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">View All Requests</h3>
              <p className="text-sm text-gray-500 group-hover:text-primary-600">See all available service requests</p>
            </div>
          </Link>

          <Link
            to="/mechanic/calendar"
            className="group flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">Service Calendar</h3>
              <p className="text-sm text-gray-500 group-hover:text-primary-600">View monthly service schedule</p>
            </div>
          </Link>

          <Link
            to="/mechanic/profile"
            className="group flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <UserIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">Update Profile</h3>
              <p className="text-sm text-gray-500 group-hover:text-primary-600">Manage your profile and settings</p>
            </div>
          </Link>

          <Link
            to="/mechanic/earnings"
            className="group flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">View Earnings</h3>
              <p className="text-sm text-gray-500 group-hover:text-primary-600">Track your earnings and payments</p>
            </div>
          </Link>

          <Link
            to="/mechanic/chat"
            className="group flex items-center p-6 border-2 border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
              <ChatBubbleLeftIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">Messages</h3>
              <p className="text-sm text-gray-500 group-hover:text-primary-600">Chat with customers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Verification Form Modal */}
      {showVerificationForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowVerificationForm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <VerificationForm onSuccess={handleVerificationSuccess} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      <NavigationModal
        isOpen={showNavigationModal}
        onClose={() => setShowNavigationModal(false)}
        request={selectedRequest}
        mechanicLocation={user?.location}
      />
    </div>
  );
};

export default MechanicDashboard;
