const axios = require('axios');

// Test mechanic chat API endpoint
async function testMechanicChatAPI() {
  try {
    console.log('🔧 Testing Mechanic Chat API...\n');

    // First, let's get a valid token by logging in as the mechanic
    console.log('🔐 Getting authentication token for mechanic...');
    
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'spamacc.noreply@gmail.com',
      password: 'Mechanic123!'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Got authentication token for mechanic');

    // Test the chat conversations endpoint
    console.log('\n📤 Testing GET /api/chat/conversations...');
    
    const conversationsResponse = await axios.get(
      'http://localhost:4000/api/chat/conversations',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Conversations API call successful!');
    console.log('Response status:', conversationsResponse.status);
    console.log('Response data:', JSON.stringify(conversationsResponse.data, null, 2));

    if (conversationsResponse.data.success) {
      const conversations = conversationsResponse.data.data;
      console.log(`\n📋 Found ${conversations.length} conversations for mechanic`);
      
      conversations.forEach((conv, index) => {
        console.log(`\n${index + 1}. Conversation ID: ${conv._id}`);
        console.log(`   Customer: ${conv.customer?.name || 'Unknown'}`);
        console.log(`   Service Request: ${conv.serviceRequest?.issueType || 'Unknown'} - ${conv.serviceRequest?.status || 'Unknown'}`);
        console.log(`   Messages: ${conv.messages?.length || 0}`);
        console.log(`   Unread: ${conv.unreadCount || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ API call failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testMechanicChatAPI();
