import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validateRequired } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import OTPModal from './OTPModal';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error, tempEmail, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Monitor authentication state changes and redirect
  useEffect(() => {
    console.log('LoginForm useEffect - Auth state:', {
      isAuthenticated,
      user: user ? `${user.name} (${user.role})` : 'None',
      showOTPModal,
      localStorage: {
        accessToken: localStorage.getItem('accessToken') ? 'Present' : 'Missing',
        user: localStorage.getItem('user') ? 'Present' : 'Missing'
      }
    });
    
    if (isAuthenticated && user && !showOTPModal) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, showOTPModal, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateRequired(formData.password, 'Password');
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      console.log('Attempting login...');
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
      
      if (result.requiresOTP) {
        console.log('OTP required, showing modal');
        setShowOTPModal(true);
      }
      // If no OTP required, the useEffect will handle the redirect
    } catch (error) {
      console.error('Login error:', error);
      // Error is handled by the context
    }
  };

  // Handle OTP success
  const handleOTPSuccess = () => {
    console.log('OTP verification successful');
    setShowOTPModal(false);
    // The useEffect will handle the redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-600">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900">
            Sign in to RoadGuard
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-secondary-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-danger-50 p-4">
              <div className="text-sm text-danger-700">{error}</div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Demo accounts info */}
        <div className="mt-6 border-t border-secondary-200 pt-6">
          <div className="text-sm text-secondary-600">
            <p className="font-medium mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs">
              <p><strong>Customer:</strong> john.doe@example.com / Customer123!</p>
              <p><strong>Mechanic:</strong> rajesh.kumar@roadguard.com / Mechanic123!</p>
              <p><strong>Admin:</strong> admin@roadguard.com / Admin123!</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <OTPModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          email={tempEmail}
          onSuccess={handleOTPSuccess}
          type="login"
        />
      )}
    </div>
  );
};

export default LoginForm;
