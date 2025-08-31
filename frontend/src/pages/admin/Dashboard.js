import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
    serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
    payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
    reviews: { totalReviews: 0, averageRating: 0 },
    topMechanics: [],
    pendingVerifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    api: { status: 'operational', message: 'All systems operational' },
    database: { status: 'operational', message: 'Connected and healthy' },
    payment: { status: 'operational', message: 'Processing normally' }
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics from API with individual error handling
      let dashboardResponse, verificationsResponse, healthResponse;
      
      try {
        dashboardResponse = await adminService.getDashboardStats();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        dashboardResponse = { success: false, data: {} };
      }
      
      try {
        verificationsResponse = await adminService.getVerifications({ status: 'pending' });
      } catch (error) {
        console.error('Error fetching verifications:', error);
        verificationsResponse = { success: false, data: { verifications: [] } };
      }
      
      try {
        healthResponse = await adminService.getSystemHealth();
      } catch (error) {
        console.error('Error fetching system health:', error);
        healthResponse = { success: false, data: {} };
      }

      if (dashboardResponse.success) {
        const dashboardData = dashboardResponse.data;
        setStats({
          ...dashboardData,
          pendingVerifications: verificationsResponse.data?.verifications?.length || 0
        });
      } else {
        // Set default stats if dashboard fails
        setStats({
          totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
          serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
          payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
          reviews: { totalReviews: 0, averageRating: 0 },
          topMechanics: [],
          pendingVerifications: 0
        });
      }

      // Set system health
      if (healthResponse.success) {
        setSystemHealth(healthResponse.data);
      }

      // Generate recent activity from various sources
      const activity = [];
      
      // Add recent transactions
      if (dashboardResponse.data?.payments?.recentTransactions) {
        dashboardResponse.data.payments.recentTransactions.forEach(transaction => {
          activity.push({
            type: 'payment',
            title: 'Payment received',
            description: `${transaction.customerId?.name || 'Customer'} paid ${formatCurrency(transaction.amount)}`,
            time: new Date(transaction.createdAt).toLocaleString(),
            icon: 'payment',
            status: transaction.status
          });
        });
      }

      // Add recent verifications
      if (verificationsResponse.data?.verifications) {
        verificationsResponse.data.verifications.slice(0, 5).forEach(verification => {
          activity.push({
            type: 'verification',
            title: 'New verification request',
            description: `${verification.mechanicId?.name || 'Mechanic'} submitted verification`,
            time: new Date(verification.createdAt).toLocaleString(),
            icon: 'verification',
            status: verification.status
          });
        });
      }

      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
      toast.error('Failed to load dashboard data');
      
      // Set default stats on complete failure
      setStats({
        totalUsers: { total: 0, customers: 0, mechanics: 0, admins: 0 },
        serviceRequests: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 },
        payments: { totalAmount: 0, totalTransactions: 0, recentTransactions: [] },
        reviews: { totalReviews: 0, averageRating: 0 },
        topMechanics: [],
        pendingVerifications: 0
      });
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">
          Manage your platform and monitor system performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {stats.totalUsers.customers} customers, {stats.totalUsers.mechanics} mechanics
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <WrenchScrewdriverIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Mechanics</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.mechanics}</p>
              <p className="text-xs text-gray-500">
                {stats.topMechanics.length > 0 ? `${stats.topMechanics.length} top performers` : 'No data'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.serviceRequests.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500">
                {stats.serviceRequests.pending} pending, {stats.serviceRequests.completed} completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.payments.totalAmount)}</p>
              <p className="text-xs text-gray-500">
                {stats.payments.totalTransactions} transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.serviceRequests.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.serviceRequests.completed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingVerifications}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500">View and manage all users</p>
            </div>
          </Link>

          <Link
            to="/admin/verifications"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Verifications</h3>
              <p className="text-sm text-gray-500">Review mechanic verifications</p>
            </div>
          </Link>

          <Link
            to="/admin/requests"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Service Requests</h3>
              <p className="text-sm text-gray-500">Monitor all service requests</p>
            </div>
          </Link>

          <Link
            to="/admin/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-500">View detailed analytics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'payment' ? 'bg-green-100' :
                      activity.type === 'verification' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'payment' ? (
                        <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                      ) : activity.type === 'verification' ? (
                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Mechanics */}
      {stats.topMechanics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Mechanics</h2>
          <div className="space-y-4">
            {stats.topMechanics.slice(0, 5).map((mechanic, index) => (
              <div key={mechanic.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {mechanic.name?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{mechanic.name}</p>
                    <p className="text-xs text-gray-500">{mechanic.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ⭐ {mechanic.rating?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mechanic.completedJobs || 0} jobs completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`flex items-center justify-between p-4 rounded-lg ${
            systemHealth.api?.status === 'operational' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`text-sm font-medium ${
                systemHealth.api?.status === 'operational' ? 'text-green-800' : 'text-red-800'
              }`}>API Status</p>
              <p className={`text-sm ${
                systemHealth.api?.status === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>{systemHealth.api?.message || 'Status unknown'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.api?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-lg ${
            systemHealth.database?.status === 'operational' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`text-sm font-medium ${
                systemHealth.database?.status === 'operational' ? 'text-green-800' : 'text-red-800'
              }`}>Database</p>
              <p className={`text-sm ${
                systemHealth.database?.status === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>{systemHealth.database?.message || 'Status unknown'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.database?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>

          <div className={`flex items-center justify-between p-4 rounded-lg ${
            systemHealth.payment?.status === 'operational' ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div>
              <p className={`text-sm font-medium ${
                systemHealth.payment?.status === 'operational' ? 'text-green-800' : 'text-red-800'
              }`}>Payment Gateway</p>
              <p className={`text-sm ${
                systemHealth.payment?.status === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>{systemHealth.payment?.message || 'Status unknown'}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              systemHealth.payment?.status === 'operational' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
