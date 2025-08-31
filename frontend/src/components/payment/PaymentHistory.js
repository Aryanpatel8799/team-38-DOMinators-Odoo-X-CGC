import React, { useState, useEffect } from 'react';
import { CreditCardIcon, CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import paymentApi from '../../api/paymentApi';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PaymentHistory = ({ limit = 5 }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, [limit]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentHistory({
        limit: limit
      });

      if (response.success) {
        setPayments(response.data.payments || []);
      } else {
        setError(response.message || 'Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError('Failed to load payment history');
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchPaymentHistory}
          className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center p-4">
        <CreditCardIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No payment history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment._id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {payment.razorpayPaymentId || payment._id.slice(-8)}
                </div>
                <div className="text-xs text-gray-500">
                  {payment.serviceRequest?.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service Payment'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(payment.amount)}
              </div>
              <div className="flex items-center justify-end mt-1">
                {getStatusIcon(payment.status)}
                <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formatDate(payment.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              {payment.paymentMethod || 'Online Payment'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;
