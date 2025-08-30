const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addTestMechanics() {
  try {
    console.log('Adding test mechanics to database...\n');

    // Check if mechanics already exist
    const existingMechanics = await User.find({ role: 'mechanic' });
    if (existingMechanics.length > 0) {
      console.log(`Found ${existingMechanics.length} existing mechanics. Skipping...`);
      return;
    }

    // Test mechanics data - locations around New York City
    const testMechanics = [
      {
        name: 'John Smith',
        email: 'john.mechanic@test.com',
        phone: '+12345678901',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'mechanic',
        location: {
          lat: 40.7589,
          lng: -73.9851
        },
        rating: 4.5,
        totalReviews: 25,
        isVerified: true,
        isActive: true,
        specialties: ['Engine repair', 'Brake service', 'Oil change']
      },
      {
        name: 'Mike Johnson',
        email: 'mike.mechanic@test.com',
        phone: '+12345678902',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'mechanic',
        location: {
          lat: 40.7505,
          lng: -73.9934
        },
        rating: 4.2,
        totalReviews: 18,
        isVerified: true,
        isActive: true,
        specialties: ['Tire repair', 'Battery service', 'AC repair']
      },
      {
        name: 'David Wilson',
        email: 'david.mechanic@test.com',
        phone: '+12345678903',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'mechanic',
        location: {
          lat: 40.7128,
          lng: -74.0060
        },
        rating: 4.8,
        totalReviews: 32,
        isVerified: true,
        isActive: true,
        specialties: ['Electrical work', 'Diagnostics', 'Transmission']
      },
      {
        name: 'Robert Brown',
        email: 'robert.mechanic@test.com',
        phone: '+12345678904',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'mechanic',
        location: {
          lat: 40.7648,
          lng: -73.9808
        },
        rating: 4.0,
        totalReviews: 15,
        isVerified: true,
        isActive: true,
        specialties: ['General repair', 'Maintenance', 'Towing']
      },
      {
        name: 'James Davis',
        email: 'james.mechanic@test.com',
        phone: '+12345678905',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'mechanic',
        location: {
          lat: 40.7484,
          lng: -73.9857
        },
        rating: 4.6,
        totalReviews: 28,
        isVerified: true,
        isActive: true,
        specialties: ['Hybrid vehicles', 'Electric cars', 'Modern diagnostics']
      }
    ];

    // Insert test mechanics
    const insertedMechanics = await User.insertMany(testMechanics);

    console.log(`✅ Successfully added ${insertedMechanics.length} test mechanics:`);
    insertedMechanics.forEach(mechanic => {
      console.log(`- ${mechanic.name} (${mechanic.email}) at ${mechanic.location.lat}, ${mechanic.location.lng}`);
    });

    console.log('\nTest mechanics are now available for nearby search!');

  } catch (error) {
    console.error('❌ Error adding test mechanics:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTestMechanics();
