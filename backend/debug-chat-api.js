require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Chat = require('./src/models/Chat');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');

// Debug chat API issues
async function debugChatAPI() {
  try {
    console.log('🔍 Debugging Chat API Issues...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Test with the mechanic's email
    const mechanicEmail = 'spamacc.noreply@gmail.com';
    const mechanic = await User.findOne({ email: mechanicEmail });
    
    if (!mechanic) {
      console.error('❌ Mechanic not found with email:', mechanicEmail);
      return;
    }

    console.log('✅ Found mechanic:', {
      id: mechanic._id,
      name: mechanic.name,
      email: mechanic.email,
      role: mechanic.role
    });

    // Create a test token
    const testToken = jwt.sign(
      { 
        id: mechanic._id.toString(),
        email: mechanic.email,
        role: mechanic.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n🔑 Test token created');
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Test the database query directly
    console.log('\n🔍 Testing database query directly...');
    
    const conversations = await Chat.find({
      participants: mechanic._id,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    console.log(`✅ Database query successful: Found ${conversations.length} conversations`);

    if (conversations.length > 0) {
      console.log('\n📋 Conversations found:');
      conversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Chat ID: ${conv._id}`);
        console.log(`   Customer: ${conv.customer?.name || 'Unknown'}`);
        console.log(`   Mechanic: ${conv.mechanic?.name || 'Unknown'}`);
        console.log(`   Service Request: ${conv.serviceRequest?.issueType || 'Unknown'} - ${conv.serviceRequest?.status || 'Unknown'}`);
        console.log(`   Messages: ${conv.messages?.length || 0}`);
        console.log(`   Participants: ${conv.participants.map(p => p.toString())}`);
        console.log(`   Mechanic ID in participants: ${conv.participants.includes(mechanic._id)}`);
      });
    }

    // Test with string comparison
    console.log('\n🔍 Testing string comparison...');
    const conversationsWithString = await Chat.find({
      participants: mechanic._id.toString(),
      isActive: true
    });

    console.log(`String comparison query: Found ${conversationsWithString.length} conversations`);

    // Test with ObjectId comparison
    console.log('\n🔍 Testing ObjectId comparison...');
    const conversationsWithObjectId = await Chat.find({
      participants: mongoose.Types.ObjectId(mechanic._id),
      isActive: true
    });

    console.log(`ObjectId comparison query: Found ${conversationsWithObjectId.length} conversations`);

    console.log('\n🎉 Debug completed successfully!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugChatAPI();
