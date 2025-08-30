import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const OTPModal = ({ isOpen, onClose, email, onSuccess, type = 'login' }) => {
  const { verifyOTP, verifyRegistrationOTP, resendOTP, loading, error } = useAuth();
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Timer for resend OTP
  useEffect(() => {
    if (timeLeft > 0 && isOpen) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, isOpen]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOtpValues(['', '', '', '', '', '']);
      setTimeLeft(60);
      setCanResend(false);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle OTP input change
  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedNumbers = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (pastedNumbers.length === 6) {
      setOtpValues(pastedNumbers.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otp = otpValues.join('');
    
    if (otp.length !== 6) {
      return;
    }

    try {
      if (type === 'login') {
        await verifyOTP(email, otp);
      } else {
        await verifyRegistrationOTP(email, otp);
      }
      onSuccess();
    } catch (error) {
      // Error handled by context
      // Clear OTP inputs
      setOtpValues(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      setTimeLeft(60);
      setCanResend(false);
    } catch (error) {
      // Error handled by context
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-secondary-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Verify OTP
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-sm text-secondary-600 mb-6">
                  We've sent a 6-digit verification code to{' '}
                  <span className="font-medium">{email}</span>
                </p>

                {/* OTP Input */}
                <div className="flex space-x-2 justify-center mb-6">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={value}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-lg font-medium border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ))}
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 rounded-md bg-danger-50">
                    <p className="text-sm text-danger-700">{error}</p>
                  </div>
                )}

                {/* Resend OTP */}
                <div className="text-center mb-6">
                  {canResend ? (
                    <button
                      onClick={handleResendOTP}
                      className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-secondary-500">
                      Resend OTP in {timeLeft}s
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleVerifyOTP}
                    className="flex-1"
                    loading={loading}
                    disabled={loading || otpValues.join('').length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
