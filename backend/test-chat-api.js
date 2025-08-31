const axios = require('axios');

// Test the exact API call that's failing
async function testChatAPI() {
  try {
    console.log('🧪 Testing Chat API Call...\n');

    // First, let's get a valid token by logging in
    console.log('🔐 Getting authentication token...');
    
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'amp8799@gmail.com',
      password: 'Customer123!'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Got authentication token');

    // Test the exact API call that's failing
    const serviceRequestId = '68b3a1d44aec689dda2d33a6';
    const messageData = {
      content: 'Test message from API',
      messageType: 'text'
    };

    console.log(`📤 Sending message to service request: ${serviceRequestId}`);
    console.log('Message data:', messageData);

    const response = await axios.post(
      `http://localhost:4000/api/chat/conversations/${serviceRequestId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API call successful!');
    console.log('Response:', response.data);

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
testChatAPI();
