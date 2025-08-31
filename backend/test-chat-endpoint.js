const axios = require('axios');

// Test the chat endpoint without validation
async function testChatEndpoint() {
  try {
    console.log('🧪 Testing Chat Endpoint...\n');

    // Test with a simple POST request
    const serviceRequestId = '68b3a1d44aec689dda2d33a6';
    const messageData = {
      content: 'Test message without validation',
      messageType: 'text'
    };

    console.log(`📤 Testing POST to /api/chat/conversations/${serviceRequestId}/messages`);
    console.log('Message data:', messageData);

    const response = await axios.post(
      `http://localhost:4000/api/chat/conversations/${serviceRequestId}/messages`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      }
    );

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.error('❌ Request failed:');
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
testChatEndpoint();
