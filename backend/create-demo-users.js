const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const demoUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+911234567891',
    passwordHash: 'Customer123!',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '+911234567892',
    passwordHash: 'Customer123!',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Admin User',
    email: 'admin@roadguard.com',
    phone: '+911234567890',
    passwordHash: 'Admin123!',
    role: 'admin',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@roadguard.com',
    phone: '+911234567893',
    passwordHash: 'Mechanic123!',
    role: 'mechanic',
    isActive: true,
    isVerified: true
  }
];

async function createDemoUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://aryanpatel8799:OXu7Ur5wYzACtCBH@cluster0.lcgbu.mongodb.net/roadguard');
    console.log('Connected to MongoDB');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Create new users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.name} (${user.email})`);
    }
    
    console.log('Demo users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createDemoUsers();
