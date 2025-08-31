require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');

// Test mechanic chat access
async function testMechanicChat() {
  try {
    console.log('🔧 Testing Mechanic Chat Access...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const mechanicId = '68b2ebb94abdf29065c1750a'; // Rajesh Kumar

    // Find all chat conversations where the mechanic is a participant
    const mechanicChats = await Chat.find({
      participants: mechanicId,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name')
    .sort({ updatedAt: -1 });

    console.log(`✅ Found ${mechanicChats.length} chat conversations for mechanic`);

    if (mechanicChats.length === 0) {
      console.log('No chat conversations found. Creating a test conversation...');
      
      // Find a customer and create a test service request
      const customer = await User.findOne({ role: 'customer' });
      if (!customer) {
        console.error('No customer found to create test conversation');
        return;
      }

      // Create a test service request
      const serviceRequest = new ServiceRequest({
        customerId: customer._id,
        mechanicId: mechanicId,
        issueType: 'flat_tire',
        description: 'Test service request for mechanic chat',
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

      await serviceRequest.save();
      console.log(`✅ Created test service request: ${serviceRequest._id}`);

      // Create chat conversation
      const chat = new Chat({
        participants: [customer._id, mechanicId],
        serviceRequest: serviceRequest._id,
        customer: customer._id,
        mechanic: mechanicId,
        messages: []
      });

      await chat.save();
      console.log(`✅ Created test chat conversation: ${chat._id}`);

      // Add some test messages
      await chat.addMessage(customer._id, 'Hello, I need help with my flat tire', 'text');
      await chat.addMessage(mechanicId, 'Sure! I can help you with that. What\'s your exact location?', 'text');
      await chat.addMessage(customer._id, 'I\'m at the mall parking lot', 'text');

      console.log('✅ Added test messages to conversation');
    }

    // Display all mechanic's conversations
    const allMechanicChats = await Chat.find({
      participants: mechanicId,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name')
    .sort({ updatedAt: -1 });

    console.log('\n📋 Mechanic\'s Chat Conversations:');
    allMechanicChats.forEach((chat, index) => {
      console.log(`\n${index + 1}. Chat ID: ${chat._id}`);
      console.log(`   Customer: ${chat.customer.name} (${chat.customer.email})`);
      console.log(`   Service Request: ${chat.serviceRequest.issueType} - ${chat.serviceRequest.status}`);
      console.log(`   Messages: ${chat.messages.length}`);
      console.log(`   Last Updated: ${chat.updatedAt}`);
      
      if (chat.messages.length > 0) {
        console.log('   Recent Messages:');
        chat.messages.slice(-3).forEach((msg, msgIndex) => {
          console.log(`     ${msgIndex + 1}. ${msg.sender.name}: "${msg.content}"`);
        });
      }
    });

    console.log('\n🎉 Mechanic chat test completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total conversations: ${allMechanicChats.length}`);
    console.log(`   - Total messages: ${allMechanicChats.reduce((sum, chat) => sum + chat.messages.length, 0)}`);
    console.log(`   - Active conversations: ${allMechanicChats.filter(chat => chat.isActive).length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testMechanicChat();
