const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const logger = require('../config/logger');
const aiQuotationService = require('../services/aiQuotationService');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     MechanicProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         specializations:
 *           type: array
 *           items:
 *             type: string
 *         experience:
 *           type: number
 *         rating:
 *           type: number
 *         totalJobs:
 *           type: number
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         availability:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             workingHours:
 *               type: object
 *         vehicles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Vehicle'
 */

/**
 * @swagger
 * /api/mechanic/profile:
 *   get:
 *     summary: Get mechanic profile with statistics
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/MechanicProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getProfile = async (req, res) => {
  try {
    const mechanicId = req.user.id;

    // Get mechanic details with statistics
    const [mechanic, jobStats, recentReviews] = await Promise.all([
      User.findById(mechanicId).select('-password -refreshTokens'),
      
      ServiceRequest.aggregate([
        { $match: { assignedMechanic: new mongoose.Types.ObjectId(mechanicId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      Review.find({ mechanic: mechanicId })
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found'
      });
    }

    // Process job statistics
    const jobStatsByStatus = jobStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const statistics = {
      totalJobs: Object.values(jobStatsByStatus).reduce((sum, count) => sum + count, 0),
      completedJobs: jobStatsByStatus.completed || 0,
      activeJobs: jobStatsByStatus.active || 0,
      cancelledJobs: jobStatsByStatus.cancelled || 0,
      pendingJobs: jobStatsByStatus.pending || 0
    };

    // Calculate earnings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await Payment.aggregate([
      {
        $lookup: {
          from: 'servicerequests',
          localField: 'serviceRequest',
          foreignField: '_id',
          as: 'request'
        }
      },
      {
        $match: {
          'request.assignedMechanic': new mongoose.Types.ObjectId(mechanicId),
          status: 'success',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const earnings = {
      thisMonth: monthlyEarnings[0]?.totalEarnings || 0,
      transactionCount: monthlyEarnings[0]?.transactionCount || 0
    };

    logger.info('Mechanic profile retrieved', {
      mechanicId,
      totalJobs: statistics.totalJobs
    });

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        profile: mechanic,
        statistics,
        earnings,
        recentReviews
      }
    });

  } catch (error) {
    logger.error('Error fetching mechanic profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/profile:
 *   patch:
 *     summary: Update mechanic profile
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[\d\s\-\(\)]{10,15}$'
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               workingHours:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                   end:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               vehicles:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Vehicle'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
const updateProfile = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated
    delete updateData.email;
    delete updateData.role;
    delete updateData.rating;
    delete updateData.totalJobs;

    const updatedMechanic = await User.findByIdAndUpdate(
      mechanicId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!updatedMechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found'
      });
    }

    logger.info('Mechanic profile updated', {
      mechanicId,
      updatedFields: Object.keys(updateData)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedMechanic
    });

  } catch (error) {
    logger.error('Error updating mechanic profile:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/availability:
 *   patch:
 *     summary: Update availability status
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
const updateAvailability = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { isAvailable, location } = req.body;

    const updateData = { 'availability.isAvailable': isAvailable };
    
    if (location) {
      updateData.location = location;
      updateData['availability.lastLocationUpdate'] = new Date();
    }

    const mechanic = await User.findByIdAndUpdate(
      mechanicId,
      { $set: updateData },
      { new: true }
    ).select('availability location name');

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found'
      });
    }

    // Emit real-time update to admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('mechanicAvailabilityUpdate', {
        mechanicId,
        name: mechanic.name,
        isAvailable,
        location: mechanic.location,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Mechanic availability updated', {
      mechanicId,
      isAvailable,
      hasLocation: !!location
    });

    res.json({
      success: true,
      message: `Availability ${isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: {
        isAvailable,
        location: mechanic.location,
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/requests:
 *   get:
 *     summary: Get assigned service requests
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Service requests retrieved successfully
 */
const getAssignedRequests = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter - show requests assigned to this mechanic (both pending direct bookings and assigned requests)
    const filter = { mechanicId: mechanicId };
    if (status) {
      filter.status = status;
    } else {
      // If no status filter, show both pending and assigned requests
      filter.status = { $in: ['pending', 'assigned', 'enroute', 'in_progress'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, totalRequests] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ServiceRequest.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalRequests / parseInt(limit));

    logger.info('Mechanic requests retrieved', {
      mechanicId,
      status: status || 'all',
      totalRequests
    });

    res.json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRequests,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching assigned requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/requests/{requestId}/accept:
 *   patch:
 *     summary: Accept a service request
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimatedArrival
 *             properties:
 *               estimatedArrival:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 180
 *                 description: Estimated arrival time in minutes
 *               quotation:
 *                 type: number
 *                 minimum: 0
 *                 description: Service quotation amount
 *     responses:
 *       200:
 *         description: Request accepted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
const acceptRequest = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { requestId } = req.params;
    const { estimatedArrival, quotation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID'
      });
    }

    const request = await ServiceRequest.findOne({
      _id: requestId,
      mechanicId: mechanicId,
      status: 'pending'
    }).populate('customerId', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or already processed'
      });
    }

    // Generate AI quotation if not provided
    let finalQuotation = quotation;
    if (!finalQuotation) {
      try {
        const quotationResult = await aiQuotationService.generateQuotation({
          issueType: request.issueType,
          description: request.description,
          vehicleInfo: request.vehicleInfo,
          location: request.location,
          priority: request.priority
        });
        finalQuotation = quotationResult.quotation;
      } catch (aiError) {
        logger.warn('AI quotation failed, using fallback', { error: aiError.message });
        finalQuotation = 1500; // Fallback amount
      }
    }

    // Update request status
    request.status = 'assigned';
    request.acceptedAt = new Date();
    request.estimatedArrival = estimatedArrival || 30; // Default 30 minutes if not provided
    request.quotation = finalQuotation;
    
    // Add timeline entry
    if (!request.history) request.history = [];
    request.history.push({
      status: 'assigned',
      timestamp: new Date(),
      description: `Service accepted by mechanic. ETA: ${request.estimatedArrival} minutes`,
      updatedBy: mechanicId
    });

    await request.save();

    // Send notification to customer
    try {
      await notificationService.notifyRequestAccepted(request.customerId, request, req.user);
    } catch (notificationError) {
      logger.error('Failed to send acceptance notification:', notificationError);
    }

    logger.info('Service request accepted', {
      requestId,
      mechanicId,
      customerId: request.customerId,
      estimatedArrival: request.estimatedArrival,
      quotation: finalQuotation
    });

    res.json({
      success: true,
      message: 'Service request accepted successfully',
      data: {
        requestId,
        status: 'assigned',
        estimatedArrival: request.estimatedArrival,
        quotation: finalQuotation,
        acceptedAt: request.acceptedAt,
        customer: request.customerId
      }
    });

  } catch (error) {
    logger.error('Error accepting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept service request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/requests/{requestId}/start:
 *   patch:
 *     summary: Start working on a service request
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               arrivalLocation:
 *                 $ref: '#/components/schemas/Location'
 *               workStartNotes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Work started successfully
 */
const startWork = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { requestId } = req.params;
    const { arrivalLocation, workStartNotes } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedMechanic: mechanicId,
      status: 'active'
    }).populate('customer', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or not in active status'
      });
    }

    // Update request
    request.workStartedAt = new Date();
    if (arrivalLocation) request.arrivalLocation = arrivalLocation;
    if (workStartNotes) request.workStartNotes = workStartNotes;

    // Add timeline entry
    request.timeline.push({
      status: 'work_started',
      timestamp: new Date(),
      description: workStartNotes || 'Mechanic arrived and started working',
      location: arrivalLocation || request.location
    });

    await request.save();

    // Real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.to(`customer_${request.customer._id}`).emit('workStarted', {
        requestId,
        mechanicName: req.user.name,
        startTime: request.workStartedAt,
        notes: workStartNotes,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Work started on service request', {
      requestId,
      mechanicId,
      customerId: request.customer._id
    });

    res.json({
      success: true,
      message: 'Work started successfully',
      data: {
        requestId,
        workStartedAt: request.workStartedAt,
        notes: workStartNotes
      }
    });

  } catch (error) {
    logger.error('Error starting work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start work',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/requests/{requestId}/complete:
 *   patch:
 *     summary: Complete a service request
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workSummary
 *               - finalAmount
 *             properties:
 *               workSummary:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               finalAmount:
 *                 type: number
 *                 minimum: 0
 *               partsUsed:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     cost:
 *                       type: number
 *               recommendations:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Service completed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
const completeRequest = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { requestId } = req.params;
    const { workSummary, finalAmount, partsUsed, recommendations } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedMechanic: mechanicId,
      status: 'active'
    }).populate('customer', 'name email phone');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found or not in active status'
      });
    }

    // Update request
    request.status = 'completed';
    request.completedAt = new Date();
    request.workSummary = workSummary;
    request.finalAmount = finalAmount;
    request.partsUsed = partsUsed || [];
    request.recommendations = recommendations;

    // Calculate work duration
    if (request.workStartedAt) {
      request.workDuration = Math.round((request.completedAt - request.workStartedAt) / (1000 * 60)); // in minutes
    }

    // Add timeline entry
    request.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      description: `Service completed. ${workSummary}`,
      location: request.arrivalLocation || request.location
    });

    await request.save();

    // Update mechanic statistics
    await User.findByIdAndUpdate(mechanicId, {
      $inc: { 'stats.completedJobs': 1 }
    });

    // Real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.to(`customer_${request.customer._id}`).emit('requestCompleted', {
        requestId,
        mechanicName: req.user.name,
        workSummary,
        finalAmount,
        completedAt: request.completedAt,
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Service request completed', {
      requestId,
      mechanicId,
      customerId: request.customer._id,
      finalAmount,
      workDuration: request.workDuration
    });

    res.json({
      success: true,
      message: 'Service completed successfully',
      data: {
        requestId,
        status: 'completed',
        completedAt: request.completedAt,
        finalAmount,
        workDuration: request.workDuration
      }
    });

  } catch (error) {
    logger.error('Error completing service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete service request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/earnings:
 *   get:
 *     summary: Get earnings summary
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
 */
const getEarnings = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // month
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    const earnings = await Payment.aggregate([
      {
        $lookup: {
          from: 'servicerequests',
          localField: 'serviceRequest',
          foreignField: '_id',
          as: 'request'
        }
      },
      {
        $match: {
          'request.assignedMechanic': new mongoose.Types.ObjectId(mechanicId),
          status: 'success',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const totalEarnings = earnings.reduce((sum, day) => sum + day.dailyEarnings, 0);
    const totalTransactions = earnings.reduce((sum, day) => sum + day.transactionCount, 0);

    logger.info('Mechanic earnings retrieved', {
      mechanicId,
      period,
      totalEarnings,
      totalTransactions
    });

    res.json({
      success: true,
      message: 'Earnings retrieved successfully',
      data: {
        period,
        dateRange: {
          from: startDate.toISOString(),
          to: now.toISOString()
        },
        summary: {
          totalEarnings,
          totalTransactions,
          averagePerTransaction: totalTransactions > 0 ? totalEarnings / totalTransactions : 0
        },
        dailyBreakdown: earnings
      }
    });

  } catch (error) {
    logger.error('Error fetching earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @swagger
 * /api/mechanic/requests/{requestId}/status:
 *   patch:
 *     summary: Update request status
 *     tags: [Mechanic - Service Requests]
 *     security:
 *       - bearerAuth: []
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const mechanicId = req.user.id;

    // Find the service request
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('customerId', 'name email phone');

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Verify the request is assigned to this mechanic
    if (serviceRequest.mechanicId?.toString() !== mechanicId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }

    // Validate status transition
    const validTransitions = {
      'assigned': ['enroute', 'cancelled'],
      'enroute': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    const currentStatus = serviceRequest.status;
    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    // Update the request status
    const previousStatus = serviceRequest.status;
    serviceRequest.status = status;

    // Add to history
    serviceRequest.history.push({
      status,
      timestamp: new Date(),
      note: `Status updated from ${previousStatus} to ${status}`,
      updatedBy: mechanicId
    });

    // Update relevant timestamps
    if (status === 'enroute') {
      serviceRequest.startedAt = new Date();
    } else if (status === 'completed') {
      serviceRequest.completedAt = new Date();
    } else if (status === 'cancelled') {
      serviceRequest.cancelledAt = new Date();
    }

    await serviceRequest.save();

    logger.info('Service request status updated', {
      requestId,
      mechanicId,
      previousStatus,
      newStatus: status
    });

    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: {
        request: serviceRequest
      }
    });

  } catch (error) {
    logger.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvailability,
  getAssignedRequests,
  acceptRequest,
  startWork,
  completeRequest,
  updateRequestStatus,
  getEarnings
};
