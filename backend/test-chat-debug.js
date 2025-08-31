require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
const Chat = require('./src/models/Chat');

// Test chat message sending functionality
async function testChatDebug() {
  try {
    console.log('🔍 Testing Chat Message Sending...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Get test users
    const customer = await User.findOne({ email: 'john@example.com', role: 'customer' });
    const mechanic = await User.findOne({ email: 'spamacc.noreply@gmail.com', role: 'mechanic' });

    if (!customer || !mechanic) {
      console.error('❌ Test users not found. Please run the seed script first.');
      return;
    }

    console.log('✅ Found test users:');
    console.log(`   Customer: ${customer.name} (${customer._id})`);
    console.log(`   Mechanic: ${mechanic.name} (${mechanic._id})`);

    // Test 1: Find existing service request
    console.log('\n📋 Test 1: Finding existing service request...');
    const serviceRequest = await ServiceRequest.findOne({
      customerId: customer._id,
      status: { $in: ['pending', 'assigned', 'enroute', 'in_progress'] }
    });

    let requestToUse;
    if (!serviceRequest) {
      console.log('No existing service request found, creating one...');
      requestToUse = new ServiceRequest({
        customerId: customer._id,
        mechanicId: mechanic._id,
        issueType: 'flat_tire',
        description: 'Test service request for chat debug',
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
        status: 'assigned'
      });
      await requestToUse.save();
      console.log(`✅ Created new service request: ${requestToUse._id}`);
    } else {
      console.log(`✅ Found existing service request: ${serviceRequest._id}`);
      requestToUse = serviceRequest;
    }

    // Test 2: Find or create chat conversation
    console.log('\n💬 Test 2: Finding or creating chat conversation...');
    let chat = await Chat.findOne({
      serviceRequest: requestToUse._id,
      isActive: true
    });

    if (!chat) {
      console.log('No chat conversation found, creating one...');
      chat = new Chat({
        participants: [customer._id, mechanic._id],
        serviceRequest: requestToUse._id,
        customer: customer._id,
        mechanic: mechanic._id,
        messages: []
      });
      await chat.save();
      console.log(`✅ Created new chat conversation: ${chat._id}`);
    } else {
      console.log(`✅ Found existing chat conversation: ${chat._id}`);
    }

    // Test 3: Verify chat participants
    console.log('\n👥 Test 3: Verifying chat participants...');
    console.log('Chat participants:', chat.participants);
    console.log('Customer ID:', customer._id);
    console.log('Mechanic ID:', mechanic._id);
    console.log('Customer is participant:', chat.participants.includes(customer._id));
    console.log('Mechanic is participant:', chat.participants.includes(mechanic._id));

    // Test 4: Try to add a message
    console.log('\n📨 Test 4: Adding message to chat...');
    try {
      const message = await chat.addMessage(
        customer._id,
        'Hello, this is a test message from customer!',
        'text'
      );
      console.log('✅ Message added successfully:', message.content);
      console.log('Message ID:', message._id);
    } catch (error) {
      console.error('❌ Error adding message:', error);
      console.error('Error stack:', error.stack);
    }

    // Test 5: Add another message from mechanic
    console.log('\n📨 Test 5: Adding message from mechanic...');
    try {
      const mechanicMessage = await chat.addMessage(
        mechanic._id,
        'Hello! I can help you with that.',
        'text'
      );
      console.log('✅ Mechanic message added successfully:', mechanicMessage.content);
      console.log('Message ID:', mechanicMessage._id);
    } catch (error) {
      console.error('❌ Error adding mechanic message:', error);
      console.error('Error stack:', error.stack);
    }

    // Test 6: Verify messages were saved
    console.log('\n🔍 Test 6: Verifying saved messages...');
    const updatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name')
      .populate('customer', 'name')
      .populate('mechanic', 'name');

    console.log('✅ Chat conversation details:');
    console.log(`   Customer: ${updatedChat.customer.name}`);
    console.log(`   Mechanic: ${updatedChat.mechanic.name}`);
    console.log(`   Total messages: ${updatedChat.messages.length}`);
    console.log(`   Last message: ${updatedChat.lastMessage}`);

    updatedChat.messages.forEach((message, index) => {
      console.log(`   Message ${index + 1}: ${message.sender.name} - "${message.content}" (${message._id})`);
    });

    console.log('\n🎉 Chat debug test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testChatDebug();
