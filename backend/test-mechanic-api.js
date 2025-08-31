const mongoose = require('mongoose');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
require('dotenv').config();

async function testMechanicAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find a mechanic
    const mechanic = await User.findOne({ role: 'mechanic' });
    
    if (!mechanic) {
      console.log('No mechanic found in database');
      return;
    }

    console.log('Found mechanic:', {
      id: mechanic._id,
      name: mechanic.name,
      email: mechanic.email,
      location: mechanic.location
    });

    // Test getAssignedRequests endpoint logic
    const mechanicId = mechanic._id;
    const filter = { mechanicId: mechanicId };
    
    console.log('Testing assigned requests filter:', JSON.stringify(filter, null, 2));
    
    const assignedRequests = await ServiceRequest.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${assignedRequests.length} assigned requests for mechanic`);

    // Test available broadcast requests
    const broadcastFilter = {
      status: 'pending',
      mechanicId: { $exists: false }
    };

    console.log('Testing broadcast requests filter:', JSON.stringify(broadcastFilter, null, 2));
    
    const broadcastRequests = await ServiceRequest.find(broadcastFilter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${broadcastRequests.length} available broadcast requests`);

    // Test combined filter
    const combinedFilter = {
      $or: [
        { mechanicId: mechanicId },
        { 
          status: 'pending', 
          mechanicId: { $exists: false }
        }
      ]
    };

    console.log('Testing combined filter:', JSON.stringify(combinedFilter, null, 2));
    
    const combinedRequests = await ServiceRequest.find(combinedFilter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(`Found ${combinedRequests.length} total requests (assigned + available)`);

    console.log('\n✅ Mechanic API test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the test
testMechanicAPI(); 