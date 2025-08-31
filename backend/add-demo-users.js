require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const demoUsers = [
  // Admin user
  {
    name: 'Admin User',
    email: 'admin@roadguard.com',
    phone: '+911234567890',
    role: 'admin',
    isActive: true,
    isVerified: true,
    passwordHash: 'Admin123!'
  },
  
  // Customer users
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+911234567891',
    role: 'customer',
    isActive: true,
    isVerified: true,
    passwordHash: 'Customer123!'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '+911234567892',
    role: 'customer',
    isActive: true,
    isVerified: true,
    passwordHash: 'Customer123!'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+911234567893',
    role: 'customer',
    isActive: true,
    isVerified: true,
    passwordHash: 'Customer123!'
  },
  
  // Mechanic users
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@roadguard.com',
    phone: '+911234567894',
    role: 'mechanic',
    isActive: true,
    isVerified: true,
    rating: 4.8,
    totalReviews: 156,
    passwordHash: 'Mechanic123!'
  },
  {
    name: 'Amit Sharma',
    email: 'amit@roadguard.com',
    phone: '+911234567895',
    role: 'mechanic',
    isActive: true,
    isVerified: true,
    rating: 4.6,
    totalReviews: 203,
    passwordHash: 'Mechanic123!'
  },
  {
    name: 'Pradeep Singh',
    email: 'pradeep@roadguard.com',
    phone: '+911234567896',
    role: 'mechanic',
    isActive: true,
    isVerified: true,
    rating: 4.4,
    totalReviews: 89,
    passwordHash: 'Mechanic123!'
  }
];

async function addDemoUsers() {
  try {
    console.log('🚀 Adding demo users to database...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadguard');
    console.log('✅ Connected to MongoDB\n');
    
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`⚠️  Found ${existingUsers} existing users in database.`);
      console.log('💡 If you want to add more users, run this script again.');
      console.log('💡 If you want to clear and recreate users, run: npm run seed');
      return;
    }
    
    console.log('📝 Creating demo users...\n');
    
    // Create users with proper password hashing
    for (const userData of demoUsers) {
      const user = new User({
        ...userData,
        passwordHash: userData.passwordHash // Let the pre-save hook handle hashing
      });
      
      await user.save();
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
    }
    
    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('='.repeat(50));
    
    demoUsers.forEach(user => {
      const password = user.passwordHash;
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${password}`);
    });
    
    console.log('\n💡 You can now log in to the admin dashboard with:');
    console.log('   Email: admin@roadguard.com');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error adding demo users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addDemoUsers();
