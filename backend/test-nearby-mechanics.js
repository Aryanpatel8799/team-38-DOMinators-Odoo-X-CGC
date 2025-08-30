const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testNearbyMechanics() {
  try {
    console.log('Testing nearby mechanics functionality...\n');

    // Test 1: Check if there are any mechanics in the database
    const allMechanics = await User.find({ role: 'mechanic' }).lean();
    console.log(`Total mechanics in database: ${allMechanics.length}`);

    if (allMechanics.length === 0) {
      console.log('❌ No mechanics found in database. This is likely the issue!');
      console.log('You need to create some mechanic accounts with location data.');
      return;
    }

    // Test 2: Check mechanics with location data
    const mechanicsWithLocation = allMechanics.filter(m => m.location && m.location.lat && m.location.lng);
    console.log(`Mechanics with location data: ${mechanicsWithLocation.length}`);

    if (mechanicsWithLocation.length === 0) {
      console.log('❌ No mechanics have location data. This is the issue!');
      console.log('Mechanics need to have location.lat and location.lng fields.');
      return;
    }

    // Test 3: Check verified and active mechanics
    const verifiedActiveMechanics = mechanicsWithLocation.filter(m => m.isVerified && m.isActive);
    console.log(`Verified and active mechanics: ${verifiedActiveMechanics.length}`);

    if (verifiedActiveMechanics.length === 0) {
      console.log('❌ No verified and active mechanics found.');
      console.log('Mechanics need to be verified (isVerified: true) and active (isActive: true).');
      return;
    }

    // Test 4: Simulate the nearby mechanics query
    const testLatitude = 40.7128;
    const testLongitude = -74.0060;
    const maxDistance = 25;

    console.log(`\nTesting with location: ${testLatitude}, ${testLongitude}`);
    console.log(`Max distance: ${maxDistance}km`);

    const filter = { role: 'mechanic', isVerified: true, isActive: true };
    const mechanics = await User.find(filter).lean();

    // Calculate distances
    const mechanicsWithDistance = mechanics
      .map(mechanic => {
        if (mechanic.location && mechanic.location.lat && mechanic.location.lng) {
          const distance = calculateDistance(
            testLatitude,
            testLongitude,
            mechanic.location.lat,
            mechanic.location.lng
          );
          return { ...mechanic, distance };
        }
        return { ...mechanic, distance: null };
      })
      .filter(mechanic => mechanic.distance !== null && mechanic.distance <= maxDistance);

    console.log(`\nMechanics within ${maxDistance}km: ${mechanicsWithDistance.length}`);
    
    if (mechanicsWithDistance.length > 0) {
      mechanicsWithDistance.forEach(m => {
        console.log(`- ${m.name}: ${m.distance.toFixed(2)}km away`);
      });
    } else {
      console.log('❌ No mechanics found within the specified distance.');
      console.log('This could be because:');
      console.log('1. Mechanics are too far away');
      console.log('2. Location data is incorrect');
      console.log('3. Distance calculation is wrong');
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Run the test
testNearbyMechanics();
