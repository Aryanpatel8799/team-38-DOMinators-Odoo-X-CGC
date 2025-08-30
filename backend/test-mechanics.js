require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testMechanics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if there are any mechanics in the database
    const mechanics = await User.find({ role: 'mechanic' }).lean();
    console.log(`Found ${mechanics.length} mechanics in database`);

    if (mechanics.length <= 1) {
      console.log('Creating sample mechanics with proper location data...');
      
      // Create sample mechanics
      const sampleMechanics = [
        {
          name: 'Mike Mechanic',
          email: 'mike@example.com',
          phone: '+1234567895',
          role: 'mechanic',
          isVerified: true,
          isActive: true,
          rating: 4.8,
          completedJobs: 45,
          location: {
            lat: 40.7589,
            lng: -73.9851
          },
          specialties: ['Engine Repair', 'Brake Service', 'Oil Change']
        },
        {
          name: 'Sarah Technician',
          email: 'sarah@example.com',
          phone: '+1234567896',
          role: 'mechanic',
          isVerified: true,
          isActive: true,
          rating: 4.6,
          completedJobs: 38,
          location: {
            lat: 40.7505,
            lng: -73.9934
          },
          specialties: ['Tire Service', 'Battery Replacement', 'AC Repair']
        }
      ];

      for (const mechanicData of sampleMechanics) {
        const mechanic = new User(mechanicData);
        await mechanic.save();
        console.log(`Created mechanic: ${mechanicData.name}`);
      }
    } else {
      console.log('Mechanics found:');
      mechanics.forEach(m => {
        console.log(`- ${m.name} (${m.email}) - Rating: ${m.rating}`);
      });
    }

    // Test the nearby mechanics query
    const testLatitude = 40.7128;
    const testLongitude = -74.0060;
    const maxDistance = 25;

    const filter = { role: 'mechanic', isVerified: true, isActive: true };
    const allMechanics = await User.find(filter).lean();
    
    console.log(`\nTesting nearby mechanics query:`);
    console.log(`User location: ${testLatitude}, ${testLongitude}`);
    console.log(`Max distance: ${maxDistance}km`);
    console.log(`Total mechanics found: ${allMechanics.length}`);

    // Calculate distances
    const mechanicsWithDistance = allMechanics
      .map(mechanic => {
        if (mechanic.location && mechanic.location.lat && mechanic.location.lng) {
          const distance = calculateDistance(
            testLatitude,
            testLongitude,
            mechanic.location.lat, // latitude
            mechanic.location.lng  // longitude
          );
          return { ...mechanic, distance };
        }
        return { ...mechanic, distance: null };
      })
      .filter(mechanic => mechanic.distance !== null && mechanic.distance <= maxDistance);

    console.log(`Mechanics within ${maxDistance}km: ${mechanicsWithDistance.length}`);
    mechanicsWithDistance.forEach(m => {
      console.log(`- ${m.name}: ${m.distance.toFixed(2)}km away`);
    });

  } catch (error) {
    console.error('Error:', error);
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

testMechanics();
