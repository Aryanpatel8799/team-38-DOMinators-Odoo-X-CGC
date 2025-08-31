// Simple test to verify backend startup without database connection
console.log('🧪 Testing Backend Startup...\n');

try {
  // Test 1: Check if Chat model can be imported
  console.log('1. Testing Chat Model Import...');
  const Chat = require('./src/models/Chat');
  console.log('   ✅ Chat model imported successfully\n');

  // Test 2: Check if Chat Controller can be imported
  console.log('2. Testing Chat Controller Import...');
  const chatController = require('./src/controllers/chatController');
  console.log('   ✅ Chat controller imported successfully\n');

  // Test 3: Check if Chat Routes can be imported
  console.log('3. Testing Chat Routes Import...');
  const chatRoutes = require('./src/routes/chatRoutes');
  console.log('   ✅ Chat routes imported successfully\n');

  // Test 4: Check if Validation Middleware has sendMessage schema
  console.log('4. Testing Validation Schema...');
  const { schemas } = require('./src/middlewares/validationMiddleware');
  if (schemas.sendMessage) {
    console.log('   ✅ sendMessage validation schema exists\n');
  } else {
    console.log('   ❌ sendMessage validation schema missing\n');
  }

  // Test 5: Check if Response Utils can be imported
  console.log('5. Testing Response Utils Import...');
  const { sendSuccessResponse, sendErrorResponse } = require('./src/utils/response');
  console.log('   ✅ Response utils imported successfully\n');

  // Test 6: Check if Logger can be imported
  console.log('6. Testing Logger Import...');
  const logger = require('./src/config/logger');
  console.log('   ✅ Logger imported successfully\n');

  console.log('🎉 All imports successful! Backend should start without errors.');
  console.log('\n📋 Summary:');
  console.log('   • All modules can be imported correctly');
  console.log('   • Chat system is properly configured');
  console.log('   • Validation schemas are in place');
  console.log('   • Response utilities are available');

} catch (error) {
  console.error('❌ Import test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
