
import api from './api';

class PaymentService {
  // Create payment order
  async createPaymentOrder(requestData) {
    try {
      const response = await api.post('/customer/payments/create-order', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create payment order' };
    }
  }

  // Verify payment after completion
  async verifyPayment(paymentData) {
    try {
      const response = await api.post('/customer/payments/verify', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Payment verification failed' };
    }
  }

  // Get payment history
  async getPaymentHistory(filters = {}) {
    try {
      const response = await api.get('/customer/payments/history', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch payment history' };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const response = await api.get(`/customer/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch payment details' };
    }
  }

  // Process Razorpay payment
  async processRazorpayPayment(orderData) {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'RoadGuard',
        description: 'Service Payment',
        order_id: orderData.orderId,
        handler: function (response) {
          resolve({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    });
  }

  // Load Razorpay SDK
  loadRazorpaySDK() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }
}

const paymentService = new PaymentService();
export default paymentService;
