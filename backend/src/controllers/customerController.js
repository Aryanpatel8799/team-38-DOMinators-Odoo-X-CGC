const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Payment = require('../models/Payment');
const logger = require('../config/logger');

/**
 * Get nearby mechanics within specified distance
 */
const getNearbyMechanics = async (req, res) => {
  try {
    console.log('getNearbyMechanics called with query params:', req.query);
    
    const { 
      latitude, 
      longitude, 
      maxDistance = 25, 
      search, 
      rating, 
      sortBy = 'distance' 
    } = req.query;

    console.log('Extracted params:', { latitude, longitude, maxDistance, search, rating, sortBy });

    if (!latitude || !longitude) {
      console.log('Missing latitude or longitude:', { latitude, longitude });
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Build filter for mechanics
    const filter = { role: 'mechanic', isVerified: true, isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } }
      ];
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    // Get mechanics from database
    const mechanics = await User.find(filter).lean();
    
    console.log('Found mechanics:', mechanics.length);
    console.log('Filter used:', filter);

    // Calculate distances and filter by maxDistance
    const mechanicsWithDistance = mechanics
      .map(mechanic => {
        if (mechanic.location && mechanic.location.lat && mechanic.location.lng) {
          const distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            mechanic.location.lat, // latitude
            mechanic.location.lng  // longitude
          );
          console.log(`Mechanic ${mechanic.name}: distance = ${distance}km`);
          return { ...mechanic, distance };
        }
        console.log(`Mechanic ${mechanic.name}: no location data`);
        return { ...mechanic, distance: null };
      })
      .filter(mechanic => mechanic.distance !== null && mechanic.distance <= parseFloat(maxDistance))
      .sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'completedJobs':
            return (b.completedJobs || 0) - (a.completedJobs || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'distance':
          default:
            return a.distance - b.distance;
        }
      });

    // Add availability status based on current active requests
    const mechanicsWithAvailability = mechanicsWithDistance.map(mechanic => {
      const isAvailable = !mechanic.currentRequests || mechanic.currentRequests.length === 0;
      return {
        ...mechanic,
        isAvailable
      };
    });

    console.log('Final mechanics with availability:', mechanicsWithAvailability.length);

    logger.info('Nearby mechanics retrieved', {
      customerId: req.user?.id,
      latitude,
      longitude,
      maxDistance,
      count: mechanicsWithAvailability.length
    });

    res.json({
      success: true,
      message: 'Nearby mechanics retrieved successfully',
      data: {
        mechanics: mechanicsWithAvailability,
        total: mechanicsWithAvailability.length,
        userLocation: { latitude, longitude }
      }
    });

  } catch (error) {
    logger.error('Error fetching nearby mechanics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby mechanics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get mechanic details by ID
 */
const getMechanicDetails = async (req, res) => {
  try {
    const { mechanicId } = req.params;

    const mechanic = await User.findById(mechanicId).lean();

    if (!mechanic || mechanic.role !== 'mechanic') {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found'
      });
    }

    // Get reviews from completed service requests
    const completedRequests = await ServiceRequest.find({
      mechanicId,
      status: 'completed',
      rating: { $exists: true, $ne: null }
    })
    .populate('customerId', 'name')
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

    const reviews = completedRequests.map(request => ({
      customerName: request.customerId?.name || 'Anonymous',
      rating: request.rating,
      comment: request.review || 'No comment provided',
      createdAt: request.completedAt
    }));

    const mechanicWithReviews = {
      ...mechanic,
      reviews
    };

    logger.info('Mechanic details retrieved', {
      customerId: req.user?.id,
      mechanicId
    });

    res.json({
      success: true,
      message: 'Mechanic details retrieved successfully',
      data: mechanicWithReviews
    });

  } catch (error) {
    logger.error('Error fetching mechanic details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mechanic details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new service request
 */
const createServiceRequest = async (req, res) => {
  try {
    const {
      mechanicId,
      issueType,
      description,
      location,
      preferredTime,
      images
    } = req.body;

    const customerId = req.user.id;

    // Validate required fields
    if (!issueType || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Issue type, description, and location are required'
      });
    }

    // Create service request
    const serviceRequest = new ServiceRequest({
      customerId,
      mechanicId,
      issueType,
      description,
      location,
      preferredTime,
      images,
      status: 'pending'
    });

    await serviceRequest.save();

    logger.info('Service request created', {
      customerId,
      mechanicId,
      requestId: serviceRequest._id
    });

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: serviceRequest
    });

  } catch (error) {
    logger.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer's service requests
 */
const getServiceRequests = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customerId };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [requests, totalRequests] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('mechanicId', 'name phone rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ServiceRequest.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalRequests / parseInt(limit));

    logger.info('Service requests retrieved', {
      customerId,
      count: requests.length
    });

    res.json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: {
        items: requests,
        totalPages,
        totalItems: totalRequests,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
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
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

module.exports = {
  getNearbyMechanics,
  getMechanicDetails,
  createServiceRequest,
  getServiceRequests
};



