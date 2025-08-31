const io = require('socket.io-client');

// Test socket connection and events
async function testSocketConnection() {
  console.log('🔌 Testing Socket.IO Connection...\n');

  // Test customer socket connection
  const customerSocket = io('http://localhost:4000/requests', {
    auth: { token: 'test-customer-token' },
    transports: ['websocket', 'polling']
  });

  // Test mechanic socket connection
  const mechanicSocket = io('http://localhost:4000/requests', {
    auth: { token: 'test-mechanic-token' },
    transports: ['websocket', 'polling']
  });

  // Customer socket events
  customerSocket.on('connect', () => {
    console.log('✅ Customer connected to requests namespace:', customerSocket.id);
    
    // Join user room
    customerSocket.emit('join-user-room', 'test-customer-id');
    
    // Join a test request room
    customerSocket.emit('join_request', { requestId: 'test-request-id' });
  });

  customerSocket.on('new-message', (data) => {
    console.log('📨 Customer received new message:', data);
  });

  customerSocket.on('request-accepted', (data) => {
    console.log('✅ Customer received request accepted:', data);
  });

  // Mechanic socket events
  mechanicSocket.on('connect', () => {
    console.log('✅ Mechanic connected to requests namespace:', mechanicSocket.id);
    
    // Join mechanic area
    mechanicSocket.emit('join-mechanic-area', 'test-mechanic-id', {
      lat: 30.7333,
      lng: 76.7794
    });
  });

  mechanicSocket.on('new-request-available', (data) => {
    console.log('🆕 Mechanic received new request:', data);
  });

  mechanicSocket.on('request-taken', (data) => {
    console.log('📋 Mechanic received request taken:', data);
  });

  // Test sending a message
  setTimeout(() => {
    console.log('\n📤 Testing message sending...');
    customerSocket.emit('send-message', {
      requestId: 'test-request-id',
      message: 'Hello from customer!',
      sender: 'customer',
      timestamp: new Date().toISOString()
    });
  }, 2000);

  // Test new request broadcast
  setTimeout(() => {
    console.log('\n📡 Testing new request broadcast...');
    customerSocket.emit('new-request', {
      requestId: 'test-new-request-id',
      location: { lat: 30.7333, lng: 76.7794 },
      issueType: 'flat_tire',
      priority: 'high',
      estimatedCost: 500,
      estimatedDuration: 30,
      vehicleInfo: { type: 'car', model: 'Test Car' },
      description: 'Test service request',
      customerId: 'test-customer-id',
      broadcastRadius: 25,
      timestamp: new Date()
    });
  }, 4000);

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('\n🧹 Cleaning up test connections...');
    customerSocket.disconnect();
    mechanicSocket.disconnect();
    process.exit(0);
  }, 10000);

  // Error handling
  customerSocket.on('connect_error', (error) => {
    console.error('❌ Customer connection error:', error.message);
  });

  mechanicSocket.on('connect_error', (error) => {
    console.error('❌ Mechanic connection error:', error.message);
  });

  customerSocket.on('error', (error) => {
    console.error('❌ Customer socket error:', error);
  });

  mechanicSocket.on('error', (error) => {
    console.error('❌ Mechanic socket error:', error);
  });
}

// Run the test
testSocketConnection().catch(console.error);
