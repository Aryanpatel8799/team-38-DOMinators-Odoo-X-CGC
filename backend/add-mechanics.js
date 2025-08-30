require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function addMechanics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sampleMechanics = [
      {
        name: 'Mike Mechanic',
        email: 'mike@example.com',
        phone: '+1234567895',
        passwordHash: 'password123',
        role: 'mechanic',
        isVerified: true,
        isActive: true,
        rating: 4.8,
        completedJobs: 45,
        location: {
          address: '456 Mechanic St, New York, NY',
          coordinates: [40.7589, -73.9851]
        },
        specialties: ['Engine Repair', 'Brake Service', 'Oil Change']
      },
      {
        name: 'Sarah Technician',
        email: 'sarah@example.com',
        phone: '+1234567896',
        passwordHash: 'password123',
        role: 'mechanic',
        isVerified: true,
        isActive: true,
        rating: 4.6,
        completedJobs: 38,
        location: {
          address: '789 Service Ave, Brooklyn, NY',
          coordinates: [40.7505, -73.9934]
        },
        specialties: ['Tire Service', 'Battery Replacement', 'AC Repair']
      },
      {
        name: 'David Engineer',
        email: 'david@example.com',
        phone: '+1234567897',
        passwordHash: 'password123',
        role: 'mechanic',
        isVerified: true,
        isActive: true,
        rating: 4.9,
        completedJobs: 52,
        location: {
          address: '321 Tech Blvd, Queens, NY',
          coordinates: [40.7128, -73.8060]
        },
        specialties: ['Transmission', 'Electrical Systems', 'Diagnostics']
      }
    ];

    for (const mechanicData of sampleMechanics) {
      // Check if mechanic already exists
      const existing = await User.findOne({ email: mechanicData.email });
      if (!existing) {
        const mechanic = new User(mechanicData);
        await mechanic.save();
        console.log(`Created mechanic: ${mechanicData.name}`);
      } else {
        console.log(`Mechanic already exists: ${mechanicData.name}`);
      }
    }

    console.log('Sample mechanics added successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addMechanics();
