import React, { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  PhotoIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import mechanicVerificationService from '../../services/mechanicVerificationService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const VerificationManagement = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const fetchVerifications = useCallback(async () => {
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

      const response = await mechanicVerificationService.getAllVerifications(queryParams);
      
      if (response.success) {
        setVerifications(response.data.verifications || []);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleReview = (verification) => {
    setSelectedVerification(verification);
    setShowReviewModal(true);
  };

  const handleViewDetails = (verification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      console.log('handleReviewSubmit called with:', reviewData);
      console.log('Selected verification ID:', selectedVerification._id);
      
      const response = await mechanicVerificationService.reviewVerification(
        selectedVerification._id,
        reviewData
      );
      
      if (response.success) {
        toast.success(`Verification ${reviewData.status} successfully`);
        setShowReviewModal(false);
        setSelectedVerification(null);
        fetchVerifications(); // Refresh the list
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to review verification';
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mechanic Verifications</h1>
          <p className="text-gray-600">Review and manage mechanic verification requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by mechanic name or shop..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Verifications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Verification Requests ({pagination.totalItems})
          </h2>
        </div>

        {verifications.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No verification requests found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {verifications.map((verification) => (
              <div key={verification._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {getStatusIcon(verification.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {verification.mechanicId?.name || 'Unknown Mechanic'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                          {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Shop:</strong> {verification.shopName}
                        </div>
                        <div>
                          <strong>Email:</strong> {verification.mechanicId?.email}
                        </div>
                        <div>
                          <strong>Submitted:</strong> {formatDate(verification.createdAt)}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Address:</strong> {verification.shopAddress.street}, {verification.shopAddress.city}, {verification.shopAddress.state}
                      </div>

                      {verification.location && (
                        <div className="mt-1 text-sm text-gray-600">
                          <strong>Location:</strong> {verification.location.lat.toFixed(6)}, {verification.location.lng.toFixed(6)}
                        </div>
                      )}

                      {verification.gstNumber && (
                        <div className="mt-1 text-sm text-gray-600">
                          <strong>GST:</strong> {verification.gstNumber}
                        </div>
                      )}

                      <div className="mt-1 text-sm text-gray-600">
                        <strong>Document Type:</strong> {verification.documentType.replace('_', ' ').toUpperCase()}
                      </div>

                      {verification.status === 'rejected' && verification.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {verification.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    {verification.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleReview(verification)}
                          icon={<CheckCircleIcon className="h-4 w-4" />}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReview(verification)}
                          icon={<XCircleIcon className="h-4 w-4" />}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(verification)}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
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

      {/* Review Modal */}
      {showReviewModal && selectedVerification && (
        <ReviewModal
          verification={selectedVerification}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedVerification(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVerification && (
        <DetailsModal
          verification={selectedVerification}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVerification(null);
          }}
          onReview={() => {
            setShowDetailsModal(false);
            setShowReviewModal(true);
          }}
        />
      )}
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({ verification, onClose, onSubmit }) => {
  const [reviewData, setReviewData] = useState({
    status: '',
    notes: '',
    rejectionReason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewData.status) {
      toast.error('Please select a status');
      return;
    }

    if (reviewData.status === 'rejected' && !reviewData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      // Prepare the data to send - only include rejectionReason if status is rejected
      const dataToSend = {
        status: reviewData.status,
        notes: reviewData.notes || undefined
      };

      if (reviewData.status === 'rejected') {
        dataToSend.rejectionReason = reviewData.rejectionReason;
      }

      console.log('Sending review data:', dataToSend);
      await onSubmit(dataToSend);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Review Verification Request
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mechanic
                      </label>
                      <p className="text-sm text-gray-900">
                        {verification.mechanicId?.name} ({verification.mechanicId?.email})
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shop Details
                      </label>
                      <p className="text-sm text-gray-900">
                        {verification.shopName}<br />
                        {verification.shopAddress.street}, {verification.shopAddress.city}, {verification.shopAddress.state}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type
                      </label>
                      <p className="text-sm text-gray-900 capitalize">
                        {verification.documentType.replace('_', ' ')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Decision <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={reviewData.status}
                        onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select decision</option>
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={reviewData.notes}
                        onChange={(e) => setReviewData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Add any notes about this verification..."
                      />
                    </div>

                    {reviewData.status === 'rejected' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={reviewData.rejectionReason}
                          onChange={(e) => setReviewData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Please provide a reason for rejection..."
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                variant={reviewData.status === 'approved' ? 'success' : 'danger'}
                loading={loading}
                disabled={loading}
                className="ml-3"
              >
                {reviewData.status === 'approved' ? 'Approve' : 'Reject'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Details Modal Component
const DetailsModal = ({ verification, onClose, onReview }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Verification Details
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mechanic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mechanic Information
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900 font-medium">{verification.mechanicId?.name}</p>
                        <p className="text-sm text-gray-600">{verification.mechanicId?.email}</p>
                        <p className="text-sm text-gray-600">{verification.mechanicId?.phone}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shop Details
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900 font-medium">{verification.shopName}</p>
                        <p className="text-sm text-gray-600">
                          {verification.shopAddress.street}<br />
                          {verification.shopAddress.city}, {verification.shopAddress.state} {verification.shopAddress.zipCode}<br />
                          {verification.shopAddress.country}
                        </p>
                        {verification.gstNumber && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>GST:</strong> {verification.gstNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Information
                      </label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-900 capitalize">
                          {verification.documentType.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {formatDate(verification.createdAt)}
                        </p>
                        {verification.status !== 'pending' && (
                          <p className="text-sm text-gray-600">
                            Reviewed: {formatDate(verification.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {verification.status === 'rejected' && verification.rejectionReason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason
                        </label>
                        <div className="bg-red-50 p-3 rounded-md border border-red-200">
                          <p className="text-sm text-red-700">{verification.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {verification.adminNotes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Notes
                        </label>
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                          <p className="text-sm text-blue-700">{verification.adminNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Images and Documents */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shop Image
                      </label>
                      {verification.shopImage ? (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <img 
                            src={verification.shopImage} 
                            alt="Shop" 
                            className="w-full h-48 object-cover rounded-md border"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                            }}
                          />
                          <a 
                            href={verification.shopImage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                          >
                            View Full Size
                          </a>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No shop image available</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Image
                      </label>
                      {verification.documentImage ? (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <img 
                            src={verification.documentImage} 
                            alt="Document" 
                            className="w-full h-48 object-cover rounded-md border"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x300?text=Document+Not+Available';
                            }}
                          />
                          <a 
                            href={verification.documentImage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                          >
                            View Full Size
                          </a>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No document image available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {verification.status === 'pending' && (
              <Button
                variant="primary"
                onClick={onReview}
                className="ml-3"
              >
                Review Request
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationManagement;
