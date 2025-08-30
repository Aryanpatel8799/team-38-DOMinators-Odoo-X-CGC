import React, { useState, useEffect } from 'react';
import { XMarkIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  serviceRequest, 
  amount, 
  onPaymentSuccess,
  onPaymentFailure 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'processing', 'success', 'failed'
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Load Razorpay SDK when modal opens
      paymentService.loadRazorpaySDK().catch(error => {
        console.error('Failed to load Razorpay SDK:', error);
        setError('Payment system unavailable. Please try again later.');
      });
    }
  }, [isOpen]);

  const resetModal = () => {
    setPaymentStep('details');
    setPaymentData(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Create payment order
      setPaymentStep('processing');
      
      const orderResponse = await paymentService.createPaymentOrder({
        serviceRequestId: serviceRequest._id,
        amount: amount,
        currency: 'INR'
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { order, payment } = orderResponse.data;

      // Step 2: Process payment with Razorpay
      const razorpayResult = await paymentService.processRazorpayPayment({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone
      });

      // Step 3: Verify payment on backend
      const verificationData = {
        paymentId: payment._id,
        razorpayPaymentId: razorpayResult.razorpayPaymentId,
        razorpayOrderId: razorpayResult.razorpayOrderId,
        razorpaySignature: razorpayResult.razorpaySignature
      };

      const verificationResponse = await paymentService.verifyPayment(verificationData);

      if (verificationResponse.success) {
        setPaymentData(verificationResponse.data);
        setPaymentStep('success');
        
        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(verificationResponse.data);
        }
        
        toast.success('Payment completed successfully!');
      } else {
        throw new Error('Payment verification failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setPaymentStep('failed');
      
      // Call failure callback
      if (onPaymentFailure) {
        onPaymentFailure(error);
      }
      
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (paymentStep) {
      case 'details':
        return (
          <div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Payment Details
              </h3>
              
              {/* Service Details */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-secondary-900 mb-3">Service Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Service Type:</span>
                    <span className="text-secondary-900">
                      {serviceRequest.issueType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Vehicle:</span>
                    <span className="text-secondary-900">
                      {serviceRequest.vehicleInfo?.model} ({serviceRequest.vehicleInfo?.plate})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Mechanic:</span>
                    <span className="text-secondary-900">
                      {serviceRequest.mechanic?.name || 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-secondary-200 pt-2">
                    <span className="text-secondary-900">Total Amount:</span>
                    <span className="text-secondary-900">{formatCurrency(amount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h4 className="font-medium text-secondary-900 mb-3">Payment Method</h4>
                <div className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-6 w-6 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-secondary-900">Razorpay Secure Payment</p>
                      <p className="text-sm text-secondary-600">
                        Credit Card, Debit Card, UPI, Net Banking, Wallets
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-danger-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-secondary-50 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePayment}
                loading={loading}
                disabled={loading}
                icon={<CreditCardIcon className="h-5 w-5" />}
              >
                Pay {formatCurrency(amount)}
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Processing Payment...
            </h3>
            <p className="text-secondary-600">
              Please complete the payment in the Razorpay window.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-10 w-10 text-success-600" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Payment Successful!
            </h3>
            <p className="text-secondary-600 mb-4">
              Your payment of {formatCurrency(amount)} has been processed successfully.
            </p>
            
            {paymentData && (
              <div className="bg-secondary-50 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-medium text-secondary-900 mb-2">Transaction Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Transaction ID:</span>
                    <span className="text-secondary-900 font-mono">
                      {paymentData.razorpayPaymentId || paymentData._id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Status:</span>
                    <span className="text-success-600 font-medium">Completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Date:</span>
                    <span className="text-secondary-900">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleClose}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="h-10 w-10 text-danger-600" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Payment Failed
            </h3>
            <p className="text-secondary-600 mb-4">
              {error || 'Your payment could not be processed. Please try again.'}
            </p>
            
            <div className="flex space-x-3 justify-center">
              <Button
                variant="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setPaymentStep('details')}
              >
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity"
          onClick={paymentStep === 'details' ? handleClose : undefined}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          {paymentStep === 'details' && (
            <div className="px-6 py-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-secondary-900">
                  Complete Payment
                </h2>
                <button
                  onClick={handleClose}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {getStepContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
