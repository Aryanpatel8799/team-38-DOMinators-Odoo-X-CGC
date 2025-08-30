const mongoose = require('mongoose');
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
const Payment = require('./src/models/Payment');
const MechanicVerification = require('./src/models/MechanicVerification');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/roadguard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const generateSampleData = async () => {
  try {
    console.log('Starting to seed database...');

    // Clear existing data
    await User.deleteMany({});
    await ServiceRequest.deleteMany({});
    await Payment.deleteMany({});
    await MechanicVerification.deleteMany({});

    // Create sample users
    const customers = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'customer',
        isVerified: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        role: 'customer',
        isVerified: true,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        role: 'customer',
        isVerified: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '+1234567893',
        role: 'customer',
        isVerified: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        phone: '+1234567894',
        role: 'customer',
        isVerified: true,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ]);

    const mechanics = await User.create([
      {
        name: 'Mike Mechanic',
        email: 'mike@example.com',
        phone: '+1234567895',
        role: 'mechanic',
        isVerified: true,
        rating: 4.8,
        completedJobs: 45,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
      },
      {
        name: 'Sarah Technician',
        email: 'sarah@example.com',
        phone: '+1234567896',
        role: 'mechanic',
        isVerified: true,
        rating: 4.6,
        completedJobs: 38,
        createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000) // 32 days ago
      },
      {
        name: 'David Engineer',
        email: 'david@example.com',
        phone: '+1234567897',
        role: 'mechanic',
        isVerified: true,
        rating: 4.9,
        completedJobs: 52,
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) // 28 days ago
      }
    ]);

    // Create sample service requests
    const issueTypes = ['flat_tire', 'battery_dead', 'fuel_empty', 'engine_trouble', 'accident', 'key_locked'];
    const statuses = ['pending', 'assigned', 'enroute', 'in_progress', 'completed', 'cancelled'];
    
    const serviceRequests = [];
    const payments = [];

    // Generate service requests for the last 30 days
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const mechanic = mechanics[Math.floor(Math.random() * mechanics.length)];
      const quotation = Math.floor(Math.random() * 200) + 50; // $50-$250

      let completedAt = null;
      if (status === 'completed') {
        completedAt = new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours later
      }

      const serviceRequest = {
        customerId: customer._id,
        mechanicId: status !== 'pending' ? mechanic._id : null,
        issueType,
        description: `Sample ${issueType.replace('_', ' ')} issue`,
        location: {
          address: '123 Main St, City, State',
          coordinates: [Math.random() * 180 - 90, Math.random() * 360 - 180]
        },
        status,
        quotation,
        rating: status === 'completed' ? Math.floor(Math.random() * 2) + 4 : null, // 4-5 stars
        createdAt,
        completedAt
      };

      serviceRequests.push(serviceRequest);

      // Create payment for completed requests
      if (status === 'completed') {
        payments.push({
          customerId: customer._id,
          mechanicId: mechanic._id,
          serviceRequestId: null, // Will be set after service request creation
          amount: quotation,
          status: 'success',
          paymentMethod: 'card',
          createdAt: completedAt
        });
      }
    }

    // Create service requests
    const createdServiceRequests = await ServiceRequest.create(serviceRequests);

    // Update payments with service request IDs
    for (let i = 0; i < payments.length; i++) {
      payments[i].serviceRequestId = createdServiceRequests[i]._id;
    }

    // Create payments
    await Payment.create(payments);

    // Create mechanic verifications
    await MechanicVerification.create([
      {
        mechanicId: mechanics[0]._id,
        documentType: 'drivers_license',
        documentImage: 'https://example.com/license.jpg',
        shopImage: 'https://example.com/shop.jpg',
        shopName: 'Mike\'s Auto Repair',
        shopAddress: '456 Mechanic St, City, State',
        status: 'approved',
        reviewedBy: null,
        reviewedAt: new Date(),
        notes: 'Approved after document verification'
      },
      {
        mechanicId: mechanics[1]._id,
        documentType: 'business_license',
        documentImage: 'https://example.com/business.jpg',
        shopImage: 'https://example.com/shop2.jpg',
        shopName: 'Sarah\'s Auto Service',
        shopAddress: '789 Service Ave, City, State',
        status: 'approved',
        reviewedBy: null,
        reviewedAt: new Date(),
        notes: 'All documents verified and approved'
      },
      {
        mechanicId: mechanics[2]._id,
        documentType: 'certification',
        documentImage: 'https://example.com/cert.jpg',
        shopImage: 'https://example.com/shop3.jpg',
        shopName: 'David\'s Engineering',
        shopAddress: '321 Tech Blvd, City, State',
        status: 'pending',
        reviewedBy: null,
        reviewedAt: null,
        notes: ''
      }
    ]);

    console.log('Database seeded successfully!');
    console.log(`Created ${customers.length} customers`);
    console.log(`Created ${mechanics.length} mechanics`);
    console.log(`Created ${serviceRequests.length} service requests`);
    console.log(`Created ${payments.length} payments`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

generateSampleData();
