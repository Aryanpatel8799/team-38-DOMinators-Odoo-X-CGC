require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUsers() {
  try {
    console.log('🔍 Checking database for users...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadguard');
    console.log('✅ Connected to MongoDB\n');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);
    
    if (totalUsers === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to run the seed script to create demo users.');
      console.log('   Run: npm run seed');
      return;
    }
    
    // Get all users with basic info
    const users = await User.find({})
      .select('name email role isActive isVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('👥 Users found in database:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // Count by role
    const customers = await User.countDocuments({ role: 'customer' });
    const mechanics = await User.countDocuments({ role: 'mechanic' });
    const admins = await User.countDocuments({ role: 'admin' });
    
    console.log('📈 User Statistics:');
    console.log(`   Customers: ${customers}`);
    console.log(`   Mechanics: ${mechanics}`);
    console.log(`   Admins: ${admins}`);
    
    // Check for admin users specifically
    const adminUsers = await User.find({ role: 'admin' })
      .select('name email')
      .lean();
    
    if (adminUsers.length > 0) {
      console.log('\n👑 Admin users found:');
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
    } else {
      console.log('\n⚠️  No admin users found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUsers();
