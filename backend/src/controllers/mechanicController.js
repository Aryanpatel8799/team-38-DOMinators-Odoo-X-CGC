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
 * /api/mechanic/stats:
 *   get:
 *     summary: Get mechanic statistics and earnings summary
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mechanic statistics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getMechanicStats = async (req, res) => {
  try {
    const mechanicId = req.user.id;

    // Get total requests
    const totalRequests = await ServiceRequest.countDocuments({
      mechanicId: mechanicId
    });

    // Get completed requests
    const completedRequests = await ServiceRequest.countDocuments({
      mechanicId: mechanicId,
      status: 'completed'
    });

    // Get total earnings
    const payments = await Payment.find({
      mechanic: mechanicId,
      status: 'success'
    });

    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get average rating
    const reviews = await Review.find({
      mechanicId: mechanicId
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Get this month earnings
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthPayments = await Payment.find({
      mechanic: mechanicId,
      status: 'success',
      createdAt: { $gte: thisMonth }
    });

    const thisMonthEarnings = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get last month earnings
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthPayments = await Payment.find({
      mechanic: mechanicId,
      status: 'success',
      createdAt: { $gte: lastMonth, $lt: thisMonth }
    });

    const lastMonthEarnings = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate growth
    const growth = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        totalRequests,
        completedRequests,
        totalEarnings,
        averageRating,
        totalReviews: reviews.length,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        growth: Math.round(growth * 100) / 100
      }
    });

  } catch (error) {
    logger.error('Error getting mechanic stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mechanic statistics'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/earnings/summary:
 *   get:
 *     summary: Get mechanic earnings summary for a specific period
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for earnings summary
 *     responses:
 *       200:
 *         description: Earnings summary retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getEarningsSummary = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get payments for the period
    const payments = await Payment.find({
      mechanic: mechanicId,
      status: 'success',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('serviceRequest', 'issueType status');

    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalRequests = payments.length;
    const averageEarning = totalRequests > 0 ? totalEarnings / totalRequests : 0;

    // Get previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    previousStartDate.setTime(previousStartDate.getTime() - (endDate.getTime() - startDate.getTime()));

    const previousPayments = await Payment.find({
      mechanic: mechanicId,
      status: 'success',
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    const previousEarnings = previousPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const growth = previousEarnings > 0 
      ? ((totalEarnings - previousEarnings) / previousEarnings) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        totalEarnings,
        totalRequests,
        averageEarning: Math.round(averageEarning * 100) / 100,
        thisMonth: totalEarnings,
        lastMonth: previousEarnings,
        growth: Math.round(growth * 100) / 100
      }
    });

  } catch (error) {
    logger.error('Error getting earnings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings summary'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/earnings/detailed:
 *   get:
 *     summary: Get detailed mechanic earnings for a specific period
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for detailed earnings
 *     responses:
 *       200:
 *         description: Detailed earnings retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getDetailedEarnings = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const payments = await Payment.find({
      mechanic: mechanicId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('serviceRequest', 'issueType status')
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    logger.error('Error getting detailed earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed earnings'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/earnings/chart:
 *   get:
 *     summary: Get chart data for mechanic earnings
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for chart data
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getEarningsChart = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    let endDate = new Date();
    let intervals = 7;
    let intervalType = 'day';

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        intervals = 7;
        intervalType = 'day';
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        intervals = 30;
        intervalType = 'day';
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        intervals = 12;
        intervalType = 'week';
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        intervals = 12;
        intervalType = 'month';
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        intervals = 30;
        intervalType = 'day';
    }

    const chartData = [];
    const intervalMs = (endDate.getTime() - startDate.getTime()) / intervals;

    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(startDate.getTime() + (i * intervalMs));
      const intervalEnd = new Date(intervalStart.getTime() + intervalMs);

      const payments = await Payment.find({
        mechanic: mechanicId,
        status: 'success',
        createdAt: { $gte: intervalStart, $lt: intervalEnd }
      });

      const amount = payments.reduce((sum, payment) => sum + payment.amount, 0);

      let label;
      if (intervalType === 'day') {
        label = intervalStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (intervalType === 'week') {
        label = `Week ${Math.ceil((i + 1) / 7)}`;
      } else {
        label = intervalStart.toLocaleDateString('en-IN', { month: 'short' });
      }

      chartData.push({
        label,
        amount: Math.round(amount * 100) / 100,
        date: intervalStart
      });
    }

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    logger.error('Error getting earnings chart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings chart data'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/earnings/export:
 *   get:
 *     summary: Export mechanic earnings data
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         description: Export format
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for export
 *     responses:
 *       200:
 *         description: Export successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const exportEarnings = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { format = 'csv', period = 'month' } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const payments = await Payment.find({
      mechanic: mechanicId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('serviceRequest', 'issueType status')
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = [
        ['Date', 'Service Type', 'Customer', 'Amount', 'Status', 'Payment ID']
      ];

      payments.forEach(payment => {
        csvData.push([
          new Date(payment.createdAt).toLocaleDateString('en-IN'),
          payment.serviceRequest?.issueType?.replace('_', ' ').toUpperCase() || 'N/A',
          payment.customer?.name || 'N/A',
          payment.amount,
          payment.status,
          payment._id
        ]);
      });

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=earnings-${period}-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format'
      });
    }

  } catch (error) {
    logger.error('Error exporting earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export earnings data'
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
    const { status, page = 1, limit = 10, includeAvailable = false } = req.query;

    logger.info('Fetching mechanic requests:', {
      mechanicId,
      status,
      includeAvailable,
      page,
      limit
    });

    let filter;
    
    try {
      // For now, use simple filter to avoid complex query issues
      filter = { mechanicId: mechanicId };
      if (status) {
        filter.status = status;
      }
      // Don't filter by status if no specific status is requested - show all requests

      logger.info('Using simple filter:', JSON.stringify(filter, null, 2));
    } catch (filterError) {
      logger.error('Error building filter:', filterError);
      // Fallback to simple assigned requests filter
      filter = { mechanicId: mechanicId };
      if (status) {
        filter.status = status;
      }
      // Don't filter by status if no specific status is requested - show all requests
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    logger.info('Executing database query with filter:', JSON.stringify(filter, null, 2));

    let requests, totalRequests;
    try {
      [requests, totalRequests] = await Promise.all([
        ServiceRequest.find(filter)
          .populate('customerId', 'name email phone vehicles')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ServiceRequest.countDocuments(filter)
      ]);
    } catch (queryError) {
      logger.error('Database query failed:', queryError);
      // Fallback to simple query
      [requests, totalRequests] = await Promise.all([
        ServiceRequest.find({ mechanicId: mechanicId })
          .populate('customerId', 'name email phone vehicles')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ServiceRequest.countDocuments({ mechanicId: mechanicId })
      ]);
    }

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
        items: requests, // Changed from 'requests' to 'items' to match frontend expectation
        requests, // Keep for backward compatibility
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
    nd ;
    
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

/**
 * @swagger
 * /api/mechanic/service-areas:
 *   get:
 *     summary: Get mechanic service areas
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service areas retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const getServiceAreas = async (req, res) => {
  try {
    const mechanicId = req.user.id;

    // For now, we'll return the mechanic's service radius and location
    // In a full implementation, you'd have a separate ServiceArea model
    const mechanic = await User.findById(mechanicId);
    
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found'
      });
    }

    // Create a default service area based on mechanic's location
    const serviceAreas = [{
      _id: 'default',
      name: 'Primary Service Area',
      radius: mechanic.serviceRadius || 10,
      isActive: true,
      center: {
        lat: mechanic.location?.lat || 0,
        lng: mechanic.location?.lng || 0
      }
    }];

    res.json({
      success: true,
      data: serviceAreas
    });

  } catch (error) {
    logger.error('Error getting service areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service areas'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/service-areas:
 *   post:
 *     summary: Add new service area for mechanic
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
 *               - name
 *               - radius
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the service area
 *               radius:
 *                 type: number
 *                 description: Service radius in kilometers
 *               isActive:
 *                 type: boolean
 *                 description: Whether the area is active
 *     responses:
 *       201:
 *         description: Service area added successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const addServiceArea = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { name, radius, isActive = true } = req.body;

    if (!name || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Name and radius are required'
      });
    }

    // In a full implementation, you'd save this to a ServiceArea model
    // For now, we'll update the mechanic's service radius
    await User.findByIdAndUpdate(mechanicId, {
      serviceRadius: radius
    });

    const newServiceArea = {
      _id: Date.now().toString(),
      name,
      radius,
      isActive,
      center: {
        lat: 0,
        lng: 0
      }
    };

    res.status(201).json({
      success: true,
      data: newServiceArea
    });

  } catch (error) {
    logger.error('Error adding service area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add service area'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/service-areas/{areaId}:
 *   delete:
 *     summary: Remove service area for mechanic
 *     tags: [Mechanic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service area ID
 *     responses:
 *       200:
 *         description: Service area removed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const removeServiceArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const mechanicId = req.user.id;

    // In a full implementation, you'd delete from ServiceArea model
    // For now, we'll just return success
    if (areaId === 'default') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove default service area'
      });
    }

    res.json({
      success: true,
      message: 'Service area removed successfully'
    });

  } catch (error) {
    logger.error('Error removing service area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove service area'
    });
  }
};

/**
 * @swagger
 * /api/mechanic/availability:
 *   patch:
 *     summary: Update mechanic availability
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
 *                 description: Whether the mechanic is available for new requests
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
const updateAvailability = async (req, res) => {
  try {
    const mechanicId = req.user.id;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean'
      });
    }

    await User.findByIdAndUpdate(mechanicId, {
      isAvailable
    });

    res.json({
      success: true,
      message: `Mechanic is now ${isAvailable ? 'available' : 'unavailable'} for requests`
    });

  } catch (error) {
    logger.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
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
  getEarnings,
  getMechanicStats,
  getEarningsSummary,
  getDetailedEarnings,
  getEarningsChart,
  exportEarnings,
  getServiceAreas,
  addServiceArea,
  removeServiceArea,
  updateAvailability
};
