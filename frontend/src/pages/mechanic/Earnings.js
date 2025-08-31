import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import mechanicApi from '../../api/mechanicApi';
import { formatCurrency, formatDate, getRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Earnings = () => {
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [detailedEarnings, setDetailedEarnings] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchEarningsData();
  }, [filters]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, detailedResponse, chartResponse] = await Promise.all([
        mechanicApi.getEarningsSummary(filters),
        mechanicApi.getDetailedEarnings(filters),
        mechanicApi.getEarningsChart(filters)
      ]);

      if (summaryResponse.success) {
        setEarningsSummary(summaryResponse.data);
      }

      if (detailedResponse.success) {
        setDetailedEarnings(detailedResponse.data.earnings || []);
      }

      if (chartResponse.success) {
        setChartData(chartResponse.data);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportEarnings = async () => {
    try {
      const response = await mechanicApi.exportEarnings(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earnings-${filters.period}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Earnings exported successfully!');
    } catch (error) {
      console.error('Error exporting earnings:', error);
      toast.error('Failed to export earnings');
    }
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
    } else if (growth < 0) {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
          <p className="text-gray-600">Track your earnings and performance metrics</p>
        </div>
        <Button
          variant="primary"
          onClick={handleExportEarnings}
          icon={<ArrowDownTrayIcon className="h-4 w-4" />}
        >
          Export Earnings
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <Select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              options={[
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={fetchEarningsData}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {earningsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsSummary.totalEarnings)}
                </p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(earningsSummary.growth)}
                  <span className={`ml-1 text-sm font-medium ${getGrowthColor(earningsSummary.growth)}`}>
                    {earningsSummary.growth > 0 ? '+' : ''}{earningsSummary.growth}% vs last period
                  </span>
                </div>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Total Requests */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earningsSummary.totalRequests}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {earningsSummary.completedRequests} completed
                </p>
              </div>
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Average Earning */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Earning</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(earningsSummary.averageEarning)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  per request
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Growth Rate */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earningsSummary.growth}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  vs previous period
                </p>
              </div>
              <FireIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      {chartData && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization will be implemented here</p>
              <p className="text-sm">Data available: {chartData.length} data points</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Earnings Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Earnings</h3>
        </div>
        
        {detailedEarnings.length === 0 ? (
          <div className="p-6 text-center">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No earnings data found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailedEarnings.map((earning) => (
                  <tr key={earning._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {earning.serviceRequest?.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{earning.serviceRequest?._id?.slice(-6)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {earning.customer?.name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(earning.amount)}
                      </div>
                      {earning.processingFee > 0 && (
                        <div className="text-xs text-gray-500">
                          Fee: {formatCurrency(earning.processingFee)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {formatDate(earning.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        earning.status === 'success' ? 'bg-green-100 text-green-800' :
                        earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {earning.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {earningsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">
                  {earningsSummary.totalRequests > 0 
                    ? Math.round((earningsSummary.completedRequests / earningsSummary.totalRequests) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Response Time</span>
                <span className="font-semibold">2.5 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Rating</span>
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold ml-1">4.8/5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Engine Repair</span>
                <span className="font-semibold">{formatCurrency(1200)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Brake System</span>
                <span className="font-semibold">{formatCurrency(800)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Electrical</span>
                <span className="font-semibold">{formatCurrency(600)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">{formatCurrency(earningsSummary.totalEarnings * 0.25)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">{formatCurrency(earningsSummary.totalEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projected</span>
                <span className="font-semibold text-green-600">{formatCurrency(earningsSummary.totalEarnings * 1.2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;
