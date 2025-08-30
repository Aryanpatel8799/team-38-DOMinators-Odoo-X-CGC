require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');

// Import models
const User = require('./src/models/User');
const ServiceRequest = require('./src/models/ServiceRequest');
const Payment = require('./src/models/Payment');
const Review = require('./src/models/Review');

// Demo data
const demoUsers = [
  // Admin users
  {
    name: 'Admin User',
    email: 'admin@roadguard.com',
    password: 'Admin123!',
    phone: '+911234567890',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    location: {
      address: 'RoadGuard HQ, Tech Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    }
  },
  
  // Customer users
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Customer123!',
    phone: '+911234567891',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    location: {
      address: 'MG Road, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    vehicles: [
      {
        type: 'car',
        model: 'Swift',
        plate: 'KA01AB1234'
      }
    ]
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'Customer123!',
    phone: '+911234567892',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    location: {
      address: 'Koramangala, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245
      }
    },
    vehicles: [
      {
        type: 'car',
        model: 'City',
        plate: 'KA02CD5678'
      }
    ]
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'Customer123!',
    phone: '+911234567893',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    location: {
      address: 'Whitefield, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      coordinates: {
        latitude: 12.9698,
        longitude: 77.7500
      }
    },
    vehicles: [
      {
        type: 'motorcycle',
        model: 'Classic 350',
        plate: 'KA03EF9012'
      }
    ]
  },

  // Mechanic users
  {
    name: 'Rajesh Kumar',
    email: 'rajesh@roadguard.com',
    password: 'Mechanic123!',
    phone: '+911234567894',
    role: 'mechanic',
    isActive: true,
    emailVerified: true,
    specializations: ['Engine Repair', 'Brake Service', 'Oil Change', 'Battery Replacement'],
    experience: 8,
    rating: 4.8,
    totalReviews: 156,
    location: {
      address: 'Indiranagar, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560008',
      coordinates: {
        latitude: 12.9719,
        longitude: 77.6412
      }
    },
    availability: {
      isAvailable: true,
      workingHours: {
        start: '08:00',
        end: '20:00'
      }
    }
  },
  {
    name: 'Amit Sharma',
    email: 'amit@roadguard.com',
    password: 'Mechanic123!',
    phone: '+911234567895',
    role: 'mechanic',
    isActive: true,
    emailVerified: true,
    specializations: ['Tire Service', 'AC Repair', 'Electrical Issues', 'Transmission'],
    experience: 12,
    rating: 4.6,
    totalReviews: 203,
    location: {
      address: 'HSR Layout, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
      coordinates: {
        latitude: 12.9082,
        longitude: 77.6476
      }
    },
    availability: {
      isAvailable: true,
      workingHours: {
        start: '09:00',
        end: '21:00'
      }
    }
  },
  {
    name: 'Pradeep Singh',
    email: 'pradeep@roadguard.com',
    password: 'Mechanic123!',
    phone: '+911234567896',
    role: 'mechanic',
    isActive: true,
    emailVerified: true,
    specializations: ['Motorcycle Repair', 'Chain Service', 'Carburetor Cleaning'],
    experience: 6,
    rating: 4.4,
    totalReviews: 89,
    location: {
      address: 'BTM Layout, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560029',
      coordinates: {
        latitude: 12.9165,
        longitude: 77.6101
      }
    },
    availability: {
      isAvailable: false,
      workingHours: {
        start: '10:00',
        end: '19:00'
      }
    }
  },
  {
    name: 'Vikram Reddy',
    email: 'vikram@roadguard.com',
    password: 'Mechanic123!',
    phone: '+911234567897',
    role: 'mechanic',
    isActive: true,
    emailVerified: true,
    specializations: ['Diesel Engine', 'Truck Repair', 'Heavy Vehicle Service'],
    experience: 15,
    rating: 4.9,
    totalReviews: 312,
    location: {
      address: 'Electronic City, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      coordinates: {
        latitude: 12.8456,
        longitude: 77.6603
      }
    },
    availability: {
      isAvailable: true,
      workingHours: {
        start: '07:00',
        end: '19:00'
      }
    }
  }
];

// Demo service requests
const demoServiceRequests = [
  {
    issueType: 'Engine Problem',
    issueDescription: 'Car engine is making strange noises and losing power while driving. Need immediate inspection.',
    urgency: 'high',
    status: 'completed',
    location: {
      address: 'MG Road, Near Brigade Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    },
    vehicleInfo: {
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2020,
      type: 'car',
      fuelType: 'petrol',
      registrationNumber: 'KA01AB1234'
    },
    quotation: 2500,
    finalAmount: 2800,
    workSummary: 'Replaced air filter and cleaned fuel injectors. Engine timing adjusted.',
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    timeline: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
        description: 'Service request created'
      },
      {
        status: 'active',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000),
        description: 'Mechanic assigned and en route'
      },
      {
        status: 'completed',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        description: 'Service completed successfully'
      }
    ]
  },
  {
    issueType: 'Flat Tire',
    issueDescription: 'Front left tire is flat. Need tire replacement or repair.',
    urgency: 'medium',
    status: 'completed',
    location: {
      address: 'Koramangala 5th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      coordinates: {
        latitude: 12.9352,
        longitude: 77.6245
      }
    },
    vehicleInfo: {
      make: 'Honda',
      model: 'City',
      year: 2019,
      type: 'car',
      fuelType: 'petrol',
      registrationNumber: 'KA02CD5678'
    },
    quotation: 1200,
    finalAmount: 1200,
    workSummary: 'Replaced flat tire with spare. Checked tire pressure.',
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    issueType: 'Battery Dead',
    issueDescription: 'Motorcycle not starting. Battery seems to be dead.',
    urgency: 'high',
    status: 'active',
    location: {
      address: 'Whitefield Main Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      coordinates: {
        latitude: 12.9698,
        longitude: 77.7500
      }
    },
    vehicleInfo: {
      make: 'Royal Enfield',
      model: 'Classic 350',
      year: 2021,
      type: 'motorcycle',
      fuelType: 'petrol',
      registrationNumber: 'KA03EF9012'
    },
    quotation: 800,
    acceptedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    estimatedArrival: 45
  }
];

// Demo reviews
const demoReviews = [
  {
    rating: 5,
    comment: 'Excellent service! Rajesh was very professional and fixed my car engine issue quickly. Highly recommended.',
    tags: ['professional', 'quick', 'knowledgeable'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
  },
  {
    rating: 4,
    comment: 'Good service. Amit arrived on time and replaced the tire efficiently. Fair pricing.',
    tags: ['punctual', 'efficient', 'fair-pricing'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  }
];

// Demo payments
const demoPayments = [
  {
    amount: 2800,
    currency: 'INR',
    status: 'success',
    razorpayOrderId: 'order_demo_1234567890',
    razorpayPaymentId: 'pay_demo_1234567890',
    paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  {
    amount: 1200,
    currency: 'INR',
    status: 'success',
    razorpayOrderId: 'order_demo_0987654321',
    razorpayPaymentId: 'pay_demo_0987654321',
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    logger.info('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({})
    ]);

    // Create users with proper password handling
    logger.info('👥 Creating demo users...');
    const createdUsers = [];
    
    for (const userData of demoUsers) {
      const user = new User({
        ...userData,
        passwordHash: userData.password, // Let the pre-save hook handle hashing
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
      
      const savedUser = await user.save();
      createdUsers.push({
        ...savedUser.toObject(),
        originalPassword: userData.password // Keep for reference
      });
    }

    // Get specific users for relationships
    const customers = createdUsers.filter(user => user.role === 'customer');
    const mechanics = createdUsers.filter(user => user.role === 'mechanic');

    // Create service requests
    logger.info('🔧 Creating demo service requests...');
    const createdRequests = [];
    
    for (let i = 0; i < demoServiceRequests.length; i++) {
      const requestData = demoServiceRequests[i];
      const customer = customers[i % customers.length];
      const mechanic = mechanics[i % mechanics.length];
      
      const request = new ServiceRequest({
        ...requestData,
        customer: customer._id,
        assignedMechanic: requestData.status !== 'pending' ? mechanic._id : undefined,
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random date within last 10 days
      });
      
      const savedRequest = await request.save();
      createdRequests.push(savedRequest);
    }

    // Create payments
    logger.info('💳 Creating demo payments...');
    const completedRequests = createdRequests.filter(req => req.status === 'completed');
    
    for (let i = 0; i < demoPayments.length && i < completedRequests.length; i++) {
      const paymentData = demoPayments[i];
      const request = completedRequests[i];
      
      const payment = new Payment({
        ...paymentData,
        customer: request.customer,
        serviceRequest: request._id,
        createdAt: paymentData.paidAt
      });
      
      await payment.save();
    }

    // Create reviews
    logger.info('⭐ Creating demo reviews...');
    for (let i = 0; i < demoReviews.length && i < completedRequests.length; i++) {
      const reviewData = demoReviews[i];
      const request = completedRequests[i];
      
      const review = new Review({
        ...reviewData,
        customer: request.customer,
        mechanic: request.assignedMechanic,
        serviceRequest: request._id
      });
      
      await review.save();
    }

    // Update mechanic ratings based on reviews
    logger.info('📊 Updating mechanic ratings...');
    for (const mechanic of mechanics) {
      const reviews = await Review.find({ mechanic: mechanic._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        await User.findByIdAndUpdate(mechanic._id, {
          rating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        });
      }
    }

    logger.info('✅ Database seeding completed successfully!');
    logger.info('📋 Demo users created:');
    
    // Log demo credentials
    for (const user of createdUsers) {
      logger.info(`   ${user.role.toUpperCase()}: ${user.email} / ${user.originalPassword}`);
    }
    
    logger.info(`📊 Demo data summary:`);
    logger.info(`   Users: ${createdUsers.length}`);
    logger.info(`   Service Requests: ${createdRequests.length}`);
    logger.info(`   Payments: ${demoPayments.length}`);
    logger.info(`   Reviews: ${demoReviews.length}`);

    process.exit(0);

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  logger.info('🛑 Seeding process interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Seeding process terminated');
  process.exit(0);
});

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
