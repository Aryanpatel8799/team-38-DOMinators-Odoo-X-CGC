import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import requestService from '../../services/requestService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '../../utils/constants';

const CustomerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent requests
      const requestsResponse = await requestService.getMyRequests({ 
        limit: 5, 
        page: 1 
      });
      
      if (requestsResponse.success) {
        const requestsData = requestsResponse.data.items || [];
        setRequests(requestsData);
        
        // Calculate stats
        const totalRequests = requestsData.length;
        const activeRequests = requestsData.filter(req => 
          ['pending', 'assigned', 'enroute', 'in_progress'].includes(req.status)
        ).length;
        const completedRequests = requestsData.filter(req => 
          req.status === 'completed'
        ).length;
        const totalSpent = requestsData
          .filter(req => req.status === 'completed' && req.quotation)
          .reduce((sum, req) => sum + req.quotation, 0);
        
        setStats({
          totalRequests,
          activeRequests,
          completedRequests,
          totalSpent,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-primary-100 mb-4">
          Need roadside assistance? We're here to help 24/7.
        </p>
        <Link to="/customer/new-request">
          <Button variant="secondary" icon={<PlusIcon className="h-5 w-5" />}>
            Request Help Now
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Requests</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Active Requests</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.activeRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Completed</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.completedRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-card">
          <div className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <span className="text-secondary-600 font-semibold">₹</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Spent</p>
              <p className="text-2xl font-bold text-secondary-900">
                {formatCurrency(stats.totalSpent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow-card">
        <div className="px-6 py-4 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Requests</h2>
            <Link to="/customer/requests">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">No requests yet</h3>
              <p className="mt-1 text-sm text-secondary-500">
                Get started by creating your first service request.
              </p>
              <div className="mt-6">
                <Link to="/customer/new-request">
                  <Button variant="primary" icon={<PlusIcon className="h-5 w-5" />}>
                    Create Request
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-medium text-secondary-900">
                        {request.issueType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <div className="flex items-center text-sm text-secondary-500">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {request.location.address || 'Location provided'}
                        <span className="mx-2">•</span>
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${request.status}`}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </span>
                    {request.quotation && (
                      <span className="text-sm font-medium text-secondary-900">
                        {formatCurrency(request.quotation)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Need Emergency Help?</h3>
          <p className="text-secondary-600 mb-4">
            For urgent roadside assistance, create a high-priority request.
          </p>
          <Link to="/customer/new-request?priority=emergency">
            <Button variant="danger" className="w-full">
              Emergency Request
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Track Active Request</h3>
          <p className="text-secondary-600 mb-4">
            View real-time updates on your current service request.
          </p>
          <Link to="/customer/requests?status=active">
            <Button variant="primary" className="w-full">
              Track Request
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
