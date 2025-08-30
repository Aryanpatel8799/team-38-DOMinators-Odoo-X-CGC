const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models for testing
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');

// Test database connection
const testConnection = async () => {
  try {
    await connectDB();
    logger.info('✅ Database connection test: PASSED');
    return true;
  } catch (error) {
    logger.error('❌ Database connection test: FAILED', error.message);
    return false;
  }
};

// Test model creation
const testModels = async () => {
  try {
    // Test User model
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+1234567890',
      role: 'customer'
    });
    
    await testUser.validate();
    logger.info('✅ User model validation: PASSED');
    
    // Test ServiceRequest model
    const testRequest = new ServiceRequest({
      customer: testUser._id,
      issueType: 'Test Issue',
      issueDescription: 'Test description',
      urgency: 'medium',
      location: {
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        coordinates: {
          latitude: 12.9716,
          longitude: 77.5946
        }
      },
      vehicleInfo: {
        make: 'Test Make',
        model: 'Test Model',
        year: 2020,
        type: 'car'
      }
    });
    
    await testRequest.validate();
    logger.info('✅ ServiceRequest model validation: PASSED');
    
    return true;
  } catch (error) {
    logger.error('❌ Model validation test: FAILED', error.message);
    return false;
  }
};

// Test environment variables
const testEnvironment = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error('❌ Environment variables test: FAILED');
    logger.error(`Missing variables: ${missing.join(', ')}`);
    return false;
  }
  
  logger.info('✅ Environment variables test: PASSED');
  return true;
};

// Test JWT functionality
const testJWT = () => {
  try {
    const jwt = require('jsonwebtoken');
    
    const payload = { userId: 'test123', role: 'customer' };
    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    if (decoded.userId === payload.userId && decoded.role === payload.role) {
      logger.info('✅ JWT functionality test: PASSED');
      return true;
    } else {
      throw new Error('JWT payload mismatch');
    }
  } catch (error) {
    logger.error('❌ JWT functionality test: FAILED', error.message);
    return false;
  }
};

// Test password hashing
const testPasswordHashing = async () => {
  try {
    const password = 'testpassword123';
    const hashedPassword = await bcrypt.hash(password, 12);
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (isValid) {
      logger.info('✅ Password hashing test: PASSED');
      return true;
    } else {
      throw new Error('Password comparison failed');
    }
  } catch (error) {
    logger.error('❌ Password hashing test: FAILED', error.message);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  logger.info('🧪 Starting RoadGuard Backend Tests...');
  logger.info('================================================');
  
  const results = {
    environment: testEnvironment(),
    jwt: testJWT(),
    passwordHashing: await testPasswordHashing(),
    connection: await testConnection(),
    models: false
  };
  
  // Only test models if connection is successful
  if (results.connection) {
    results.models = await testModels();
  }
  
  logger.info('================================================');
  logger.info('🧪 Test Results Summary:');
  logger.info(`Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`JWT Functionality: ${results.jwt ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`Password Hashing: ${results.passwordHashing ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`Model Validation: ${results.models ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  logger.info(`================================================`);
  logger.info(`Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    logger.info('🎉 All tests passed! RoadGuard backend is ready.');
  } else {
    logger.error('❌ Some tests failed. Please check the configuration.');
  }
  
  // Close database connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('🛑 Test process interrupted');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = runTests;
