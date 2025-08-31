require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');

// Test chat functionality directly without API
async function testChatDirect() {
  try {
    console.log('🧪 Testing Chat Functionality Directly...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const serviceRequestId = '68b3a1d44aec689dda2d33a6';
    const customerId = '68b311e87e886d7310070d62'; // Aryan patel
    const mechanicId = '68b2ebb94abdf29065c1750a'; // Rajesh Kumar

    console.log(`🔍 Testing with service request: ${serviceRequestId}`);
    console.log(`Customer ID: ${customerId}`);
    console.log(`Mechanic ID: ${mechanicId}`);

    // Find the chat conversation
    const chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (!chat) {
      console.error('❌ Chat conversation not found');
      return;
    }

    console.log('✅ Found chat conversation:', chat._id);

    // Test adding a message as customer
    console.log('\n📨 Test 1: Adding message as customer...');
    try {
      const customerMessage = await chat.addMessage(
        customerId,
        'Hello, this is a test message from customer!',
        'text'
      );
      console.log('✅ Customer message added successfully:');
      console.log(`   Content: ${customerMessage.content}`);
      console.log(`   Message ID: ${customerMessage._id}`);
      console.log(`   Sender: ${customerMessage.sender}`);
    } catch (error) {
      console.error('❌ Error adding customer message:', error);
      console.error('Error stack:', error.stack);
    }

    // Test adding a message as mechanic
    console.log('\n📨 Test 2: Adding message as mechanic...');
    try {
      const mechanicMessage = await chat.addMessage(
        mechanicId,
        'Hello! I can help you with that.',
        'text'
      );
      console.log('✅ Mechanic message added successfully:');
      console.log(`   Content: ${mechanicMessage.content}`);
      console.log(`   Message ID: ${mechanicMessage._id}`);
      console.log(`   Sender: ${mechanicMessage.sender}`);
    } catch (error) {
      console.error('❌ Error adding mechanic message:', error);
      console.error('Error stack:', error.stack);
    }

    // Verify the chat was updated
    console.log('\n🔍 Test 3: Verifying chat updates...');
    const updatedChat = await Chat.findById(chat._id)
      .populate('messages.sender', 'name')
      .populate('customer', 'name')
      .populate('mechanic', 'name');

    console.log('✅ Updated chat details:');
    console.log(`   Total messages: ${updatedChat.messages.length}`);
    console.log(`   Last message: ${updatedChat.lastMessage}`);

    updatedChat.messages.forEach((message, index) => {
      console.log(`   Message ${index + 1}: ${message.sender.name} - "${message.content}" (${message._id})`);
    });

    console.log('\n🎉 Direct chat test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testChatDirect();
