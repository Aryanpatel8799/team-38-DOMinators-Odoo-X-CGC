import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import mechanicApi from '../../api/mechanicApi';
import { formatDate, formatCurrency, getRelativeTime } from '../../utils/helpers';
import { REQUEST_STATUS_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthRequests();
  }, [currentDate]);

  const fetchMonthRequests = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching all assigned requests for calendar...');
      
      // Fetch all requests assigned to this mechanic (all types) without date filtering
      const response = await mechanicApi.getAssignedRequests({
        limit: 1000, // Get more requests
        // Don't specify status to get all requests including completed ones
      });

      console.log('Calendar API response:', response);

      if (response.success) {
        const requestsData = response.data.items || [];
        console.log('Setting requests:', requestsData.length, 'requests');
        
        // Filter requests for the current month (all statuses)
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const monthRequests = requestsData.filter(request => {
          const requestDate = new Date(request.createdAt);
          return requestDate >= startOfMonth && requestDate <= endOfMonth;
        });
        
        console.log('Filtered requests for current month:', monthRequests.length);
        setRequests(monthRequests);
      } else {
        console.log('API response not successful:', response);
        // If API fails, try to fetch without status filter
        try {
          const fallbackResponse = await mechanicApi.getAssignedRequests({
            limit: 1000
          });
          if (fallbackResponse.success) {
            const fallbackData = fallbackResponse.data.items || [];
            console.log('Fallback: Setting requests:', fallbackData.length, 'requests');
            setRequests(fallbackData);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error fetching month requests:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getRequestsForDate = (date) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return requests.filter(request => {
      const requestDate = new Date(request.createdAt).toISOString().split('T')[0];
      return requestDate === dateString;
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      enroute: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDateClick = (date) => {
    const dayRequests = getRequestsForDate(date);
    if (dayRequests.length > 0) {
      // If multiple requests, show the first one
      setSelectedRequest(dayRequests[0]);
      setShowRequestModal(true);
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const days = getDaysInMonth(currentDate);

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
          <h1 className="text-2xl font-bold text-gray-900">Service Calendar</h1>
          <p className="text-gray-600">View and manage your service requests by month</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigateMonth('prev')}
            icon={<ChevronLeftIcon className="h-4 w-4" />}
          >
            Previous
          </Button>
          <div className="text-lg font-semibold text-gray-900">
            {formatMonthYear(currentDate)}
          </div>
          <Button
            variant="outline"
            onClick={() => navigateMonth('next')}
            icon={<ChevronRightIcon className="h-4 w-4" />}
          >
            Next
          </Button>
          <Button
            variant="primary"
            onClick={fetchMonthRequests}
            loading={loading}
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading calendar data...</span>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            const dayRequests = getRequestsForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`min-h-32 bg-white p-2 ${
                  dayRequests.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center' :
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {/* Requests for this day */}
                    <div className="space-y-1">
                      {dayRequests.slice(0, 3).map((request) => (
                        <div
                          key={request._id}
                          className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(request.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestClick(request);
                          }}
                        >
                          <div className="font-medium truncate">
                            {request.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-xs opacity-75">
                            {request.customer?.name || 'Customer'}
                          </div>
                        </div>
                      ))}
                      {dayRequests.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => ['assigned', 'enroute', 'in_progress'].includes(r.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(requests.filter(r => r.status === 'completed' && r.quotation).reduce((sum, r) => sum + r.quotation, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowRequestModal(false)}
                  icon={<XMarkIcon className="h-4 w-4" />}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service Type</label>
                      <p className="text-gray-900">
                        {selectedRequest.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {REQUEST_STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quotation</label>
                      <p className="text-gray-900">
                        {selectedRequest.quotation ? formatCurrency(selectedRequest.quotation) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}

                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedRequest.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{selectedRequest.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {selectedRequest.location && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                    <div className="flex items-start space-x-2">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <p className="text-gray-900">{selectedRequest.location.address}</p>
                    </div>
                  </div>
                )}

                {/* Vehicle Info */}
                {selectedRequest.vehicle && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Model</label>
                        <p className="text-gray-900">{selectedRequest.vehicle.model}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Number</label>
                        <p className="text-gray-900">{selectedRequest.vehicle.number}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => setShowRequestModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowRequestModal(false);
                      // Navigate to request details page or open chat
                      window.location.href = `/mechanic/requests/${selectedRequest._id}`;
                    }}
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
