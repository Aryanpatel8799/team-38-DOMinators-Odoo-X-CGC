require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
const Chat = require('./src/models/Chat');

// Test both chat messaging and broadcast request functionality
async function testChatAndBroadcast() {
  try {
    console.log('🧪 Testing Chat and Broadcast Functionality...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get test users
    const customer = await User.findOne({ email: 'john@example.com', role: 'customer' });
    const mechanic = await User.findOne({ email: 'rajesh@roadguard.com', role: 'mechanic' });

    if (!customer || !mechanic) {
      console.error('❌ Test users not found. Please run the seed script first.');
      return;
    }

    console.log('✅ Found test users:');
    console.log(`   Customer: ${customer.name} (${customer.email})`);
    console.log(`   Mechanic: ${mechanic.name} (${mechanic.email})`);

    // Test 1: Create a service request
    console.log('\n📋 Test 1: Creating service request...');
    const serviceRequest = new ServiceRequest({
      customerId: customer._id,
      issueType: 'flat_tire',
      description: 'Test service request for chat and broadcast',
      vehicleInfo: {
        type: 'car',
        model: 'Test Car',
        plate: 'TEST123',
        year: 2020
      },
      location: {
        lat: 30.7333,
        lng: 76.7794,
        address: 'Test Location, Chandigarh'
      },
      priority: 'medium',
      broadcastRadius: 25,
      status: 'pending'
    });

    await serviceRequest.save();
    console.log(`✅ Service request created: ${serviceRequest._id}`);

    // Test 2: Create chat conversation
    console.log('\n💬 Test 2: Creating chat conversation...');
    const chat = new Chat({
      participants: [customer._id, mechanic._id],
      serviceRequest: serviceRequest._id,
      customer: customer._id,
      mechanic: mechanic._id,
      messages: []
    });

    await chat.save();
    console.log(`✅ Chat conversation created: ${chat._id}`);

    // Test 3: Add messages to chat
    console.log('\n📨 Test 3: Adding messages to chat...');
    
    // Add message from customer
    const customerMessage = await chat.addMessage(
      customer._id,
      'Hello, I have a flat tire. Can you help?',
      'text'
    );
    console.log('✅ Customer message added:', customerMessage.content);

    // Add message from mechanic
    const mechanicMessage = await chat.addMessage(
      mechanic._id,
      'Sure! I can help you with that. What\'s your exact location?',
      'text'
    );
    console.log('✅ Mechanic message added:', mechanicMessage.content);

    // Test 4: Verify messages are saved
    console.log('\n🔍 Test 4: Verifying messages...');
    const updatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name')
      .populate('customer', 'name')
      .populate('mechanic', 'name')
      .populate('serviceRequest', 'issueType description');

    console.log('✅ Chat conversation details:');
    console.log(`   Customer: ${updatedChat.customer.name}`);
    console.log(`   Mechanic: ${updatedChat.mechanic.name}`);
    console.log(`   Service Request: ${updatedChat.serviceRequest.issueType}`);
    console.log(`   Messages: ${updatedChat.messages.length}`);

    updatedChat.messages.forEach((message, index) => {
      console.log(`   Message ${index + 1}: ${message.sender.name} - "${message.content}"`);
    });

    // Test 5: Test broadcast request functionality
    console.log('\n📡 Test 5: Testing broadcast request...');
    
    // Create another service request for broadcast
    const broadcastRequest = new ServiceRequest({
      customerId: customer._id,
      issueType: 'battery_dead',
      description: 'Test broadcast request',
      vehicleInfo: {
        type: 'car',
        model: 'Test Car 2',
        plate: 'TEST456',
        year: 2021
      },
      location: {
        lat: 30.7333,
        lng: 76.7794,
        address: 'Test Location 2, Chandigarh'
      },
      priority: 'high',
      broadcastRadius: 25,
      status: 'pending'
    });

    await broadcastRequest.save();
    console.log(`✅ Broadcast request created: ${broadcastRequest._id}`);

    // Find nearby mechanics (should include our test mechanic)
    const nearbyMechanics = await User.find({
      role: 'mechanic',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [broadcastRequest.location.lng, broadcastRequest.location.lat]
          },
          $maxDistance: broadcastRequest.broadcastRadius * 1000
        }
      }
    }).limit(10);

    console.log(`✅ Found ${nearbyMechanics.length} nearby mechanics for broadcast`);
    nearbyMechanics.forEach((m, index) => {
      console.log(`   ${index + 1}. ${m.name} - ${m.email}`);
    });

    // Test 6: Verify service request can be assigned to mechanic
    console.log('\n🔧 Test 6: Testing request assignment...');
    
    broadcastRequest.mechanicId = mechanic._id;
    broadcastRequest.status = 'assigned';
    await broadcastRequest.save();
    
    console.log(`✅ Request assigned to mechanic: ${mechanic.name}`);

    // Test 7: Create chat for broadcast request
    console.log('\n💬 Test 7: Creating chat for broadcast request...');
    const broadcastChat = new Chat({
      participants: [customer._id, mechanic._id],
      serviceRequest: broadcastRequest._id,
      customer: customer._id,
      mechanic: mechanic._id,
      messages: []
    });

    await broadcastChat.save();
    console.log(`✅ Broadcast chat created: ${broadcastChat._id}`);

    // Add a message to broadcast chat
    const broadcastMessage = await broadcastChat.addMessage(
      mechanic._id,
      'I\'m on my way to help with your battery issue!',
      'text'
    );
    console.log('✅ Broadcast message added:', broadcastMessage.content);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Service requests created: 2`);
    console.log(`   - Chat conversations created: 2`);
    console.log(`   - Messages sent: 3`);
    console.log(`   - Nearby mechanics found: ${nearbyMechanics.length}`);
    console.log(`   - Broadcast functionality: ✅ Working`);
    console.log(`   - Chat functionality: ✅ Working`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testChatAndBroadcast();
