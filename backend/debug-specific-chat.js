require('dotenv').config();
const mongoose = require('mongoose');
const ServiceRequest = require('./src/models/ServiceRequest');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');

// Debug specific service request chat issue
async function debugSpecificChat() {
  try {
    console.log('🔍 Debugging Specific Chat Issue...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const serviceRequestId = '68b3a1d44aec689dda2d33a6';
    console.log(`🔍 Investigating service request: ${serviceRequestId}`);

    // Check if service request exists
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      console.error('❌ Service request not found');
      return;
    }

    console.log('✅ Service request found:');
    console.log(`   ID: ${serviceRequest._id}`);
    console.log(`   Customer: ${serviceRequest.customerId}`);
    console.log(`   Mechanic: ${serviceRequest.mechanicId}`);
    console.log(`   Status: ${serviceRequest.status}`);
    console.log(`   Issue Type: ${serviceRequest.issueType}`);

    // Check if chat exists
    const chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (!chat) {
      console.log('❌ No chat conversation found for this service request');
      
      // Check if we should create one
      const customer = await User.findById(serviceRequest.customerId);
      const mechanic = serviceRequest.mechanicId ? await User.findById(serviceRequest.mechanicId) : null;
      
      console.log('Customer:', customer ? customer.name : 'Not found');
      console.log('Mechanic:', mechanic ? mechanic.name : 'Not found');
      
      if (customer && mechanic) {
        console.log('Creating chat conversation...');
        const newChat = new Chat({
          participants: [customer._id, mechanic._id],
          serviceRequest: serviceRequest._id,
          customer: customer._id,
          mechanic: mechanic._id,
          messages: []
        });
        await newChat.save();
        console.log(`✅ Created chat conversation: ${newChat._id}`);
      }
    } else {
      console.log('✅ Chat conversation found:');
      console.log(`   Chat ID: ${chat._id}`);
      console.log(`   Participants: ${chat.participants}`);
      console.log(`   Messages: ${chat.messages.length}`);
      console.log(`   Is Active: ${chat.isActive}`);
      
      // Check participants
      const participants = await User.find({ _id: { $in: chat.participants } });
      console.log('Participants details:');
      participants.forEach(p => {
        console.log(`   - ${p.name} (${p.email}) - ${p.role}`);
      });
    }

    // List all chats for this service request
    const allChats = await Chat.find({ serviceRequest: serviceRequestId });
    console.log(`\n📋 All chats for service request: ${allChats.length}`);
    allChats.forEach((c, index) => {
      console.log(`   ${index + 1}. Chat ID: ${c._id}, Active: ${c.isActive}, Messages: ${c.messages.length}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugSpecificChat();
