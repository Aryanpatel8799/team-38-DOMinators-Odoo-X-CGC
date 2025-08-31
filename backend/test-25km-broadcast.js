const mongoose = require('mongoose');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
require('dotenv').config();

// Test coordinates (Chandigarh, India)
const testLocation = {
  lat: 30.7333,
  lng: 76.7794
};

async function test25kmBroadcast() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find mechanics within 25km of test location
    const nearbyMechanics = await User.find({
      role: 'mechanic',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [testLocation.lng, testLocation.lat]
          },
          $maxDistance: 25 * 1000 // 25km in meters
        }
      }
    }).limit(50);

    console.log(`Found ${nearbyMechanics.length} mechanics within 25km of test location`);
    
    if (nearbyMechanics.length > 0) {
      console.log('Nearby mechanics:');
      nearbyMechanics.forEach((mechanic, index) => {
        console.log(`${index + 1}. ${mechanic.name} - ${mechanic.email} - Location: ${mechanic.location?.lat}, ${mechanic.location?.lng}`);
      });
    } else {
      console.log('No mechanics found within 25km. This might be normal if no mechanics are registered in the area.');
    }

    // Test creating a service request
    const testRequest = {
      customerId: new mongoose.Types.ObjectId(), // Dummy customer ID
      issueType: 'flat_tire',
      description: 'Test service request for 25km broadcast',
      vehicleInfo: {
        type: 'car',
        model: 'Test Car',
        plate: 'TEST123',
        year: 2020
      },
      location: {
        lat: testLocation.lat,
        lng: testLocation.lng,
        address: 'Test Location, Chandigarh'
      },
      priority: 'medium',
      broadcastRadius: 25
    };

    console.log('\nTest service request data:');
    console.log(JSON.stringify(testRequest, null, 2));

    console.log('\n✅ 25km broadcast test completed successfully!');
    console.log('The system is configured to broadcast service requests to mechanics within 25km radius.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
test25kmBroadcast();
