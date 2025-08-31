require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');
const Chat = require('./src/models/Chat');

// Test authentication and user ID comparison
async function testAuthDebug() {
  try {
    console.log('🔐 Testing Authentication and User ID Comparison...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const customerId = '68b311e87e886d7310070d62'; // Aryan patel
    const mechanicId = '68b2ebb94abdf29065c1750a'; // Rajesh Kumar
    const serviceRequestId = '68b3a1d44aec689dda2d33a6';

    // Get user details
    const customer = await User.findById(customerId);
    const mechanic = await User.findById(mechanicId);

    console.log('👤 User details:');
    console.log(`Customer: ${customer.name} (${customer._id})`);
    console.log(`Mechanic: ${mechanic.name} (${mechanic._id})`);

    // Create a test token for the customer
    const testToken = jwt.sign(
      { 
        id: customer._id.toString(),
        email: customer.email,
        role: customer.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n🔑 Test token created for customer');
    console.log('Token payload:', jwt.decode(testToken));

    // Verify the token
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('\n✅ Token verified successfully');
    console.log('Decoded token:', decoded);

    // Check if the user ID from token matches the customer ID
    console.log('\n🔍 User ID comparison:');
    console.log(`Token user ID: ${decoded.id}`);
    console.log(`Customer ID: ${customer._id}`);
    console.log(`IDs match: ${decoded.id === customer._id.toString()}`);
    console.log(`Type comparison: ${typeof decoded.id} vs ${typeof customer._id}`);

    // Find the chat conversation
    const chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (chat) {
      console.log('\n💬 Chat conversation details:');
      console.log(`Chat ID: ${chat._id}`);
      console.log(`Participants: ${chat.participants}`);
      console.log(`Customer is participant: ${chat.participants.includes(customer._id)}`);
      console.log(`Mechanic is participant: ${chat.participants.includes(mechanic._id)}`);

      // Test the exact comparison that might be failing
      console.log('\n🔍 Exact comparison test:');
      console.log(`Token user ID (string): "${decoded.id}"`);
      console.log(`Customer ID (ObjectId): ${customer._id}`);
      console.log(`Customer ID (string): "${customer._id.toString()}"`);
      console.log(`Direct comparison: ${decoded.id === customer._id.toString()}`);
      console.log(`Includes check: ${chat.participants.includes(customer._id)}`);
      console.log(`String includes check: ${chat.participants.map(p => p.toString()).includes(decoded.id)}`);
    }

    console.log('\n🎉 Authentication debug test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testAuthDebug();
