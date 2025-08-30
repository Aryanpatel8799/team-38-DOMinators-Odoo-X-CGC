import React, { useState, useEffect } from 'react';
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
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import VerificationForm from '../../components/mechanic/VerificationForm';
import requestService from '../../services/requestService';
import mechanicVerificationService from '../../services/mechanicVerificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchDashboardData();
    checkVerificationStatus();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch assigned requests
      const requestsResponse = await requestService.getAssignedRequests({ 
        limit: 5, 
        page: 1 
      });
      
      if (requestsResponse.success) {
        const requestsData = requestsResponse.data.items || [];
        setRequests(requestsData);
        
        // Calculate stats
        const totalRequests = requestsData.length;
        const activeRequests = requestsData.filter(req => 
          ['assigned', 'enroute', 'in_progress'].includes(req.status)
        ).length;
        const completedRequests = requestsData.filter(req => 
          req.status === 'completed'
        ).length;
        const totalEarnings = requestsData
          .filter(req => req.status === 'completed' && req.quotation)
          .reduce((sum, req) => sum + req.quotation, 0);
        
        setStats({
          totalRequests,
          activeRequests,
          completedRequests,
          totalEarnings,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await mechanicVerificationService.getVerificationStatus();
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">
          Manage your service requests and track your earnings
        </p>
      </div>

      {/* Verification Status */}
      {getVerificationStatusDisplay()}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/mechanic/requests"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">View All Requests</h3>
              <p className="text-sm text-gray-500">See all available service requests</p>
            </div>
          </Link>

          <Link
            to="/mechanic/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-500">Manage your profile and settings</p>
            </div>
          </Link>

          <Link
            to="/mechanic/earnings"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">View Earnings</h3>
              <p className="text-sm text-gray-500">Track your earnings and payments</p>
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
    </div>
  );
};

export default MechanicDashboard;
