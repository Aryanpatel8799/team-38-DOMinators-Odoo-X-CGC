const logger = require('../config/logger');

/**
 * Initialize Socket.IO for real-time service request updates
 * @param {Object} io - Socket.IO server instance
 */
const initializeRequestSocket = (io) => {
  // Namespace for service requests
  const requestNamespace = io.of('/requests');

  requestNamespace.on('connection', (socket) => {
    logger.info(`Client connected to requests namespace: ${socket.id}`);

    // Join user to their personal room
    socket.on('join-user-room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} joined their room`);
      }
    });

    // Join mechanic to their service area
    socket.on('join-mechanic-area', (mechanicId, location) => {
      if (mechanicId && location) {
        socket.join(`mechanic_${mechanicId}`);
        socket.join('available_mechanics');
        logger.info(`Mechanic ${mechanicId} joined service area`);
        
        // Update mechanic location
        socket.mechanicId = mechanicId;
        socket.location = location;
      }
    });

    // Handle new service request
    socket.on('new-request', (requestData) => {
      logger.info('New service request received:', requestData);
      
      // Broadcast to available mechanics in the area
      socket.to('available_mechanics').emit('new-request-available', {
        requestId: requestData.requestId,
        location: requestData.location,
        serviceType: requestData.serviceType,
        urgency: requestData.urgency,
        estimatedCost: requestData.estimatedCost
      });
    });

    // Handle request acceptance by mechanic
    socket.on('accept-request', (data) => {
      const { requestId, mechanicId, estimatedArrival } = data;
      
      logger.info(`Request ${requestId} accepted by mechanic ${mechanicId}`);
      
      // Notify customer
      requestNamespace.to(`request_${requestId}`).emit('request-accepted', {
        mechanicId,
        estimatedArrival,
        status: 'accepted'
      });
      
      // Notify other mechanics that request is no longer available
      socket.to('available_mechanics').emit('request-taken', { requestId });
    });

    // Handle location updates
    socket.on('location-update', (data) => {
      const { userId, location, heading, speed } = data;
      
      // Broadcast location update to relevant parties
      if (socket.mechanicId) {
        // Mechanic location update - notify customers with active requests
        socket.to(`mechanic_${socket.mechanicId}_customers`).emit('mechanic-location-update', {
          mechanicId: socket.mechanicId,
          location,
          heading,
          speed,
          timestamp: new Date()
        });
      } else {
        // Customer location update - notify assigned mechanic
        socket.to(`user_${userId}_mechanic`).emit('customer-location-update', {
          customerId: userId,
          location,
          timestamp: new Date()
        });
      }
    });

    // Handle status updates
    socket.on('status-update', (data) => {
      const { requestId, status, message, location } = data;
      
      logger.info(`Status update for request ${requestId}: ${status}`);
      
      // Broadcast status update to all parties involved
      requestNamespace.to(`request_${requestId}`).emit('status-update', {
        status,
        message,
        location,
        timestamp: new Date()
      });
    });

    // Handle work started
    socket.on('work-started', (data) => {
      const { requestId, mechanicId, arrivalTime } = data;
      
      requestNamespace.to(`request_${requestId}`).emit('work-started', {
        mechanicId,
        arrivalTime,
        status: 'in_progress',
        timestamp: new Date()
      });
    });

    // Handle work completed
    socket.on('work-completed', (data) => {
      const { requestId, workSummary, finalAmount, completionTime } = data;
      
      requestNamespace.to(`request_${requestId}`).emit('work-completed', {
        workSummary,
        finalAmount,
        completionTime,
        status: 'completed',
        timestamp: new Date()
      });
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      const { requestId, senderId, message, messageType } = data;
      
      requestNamespace.to(`request_${requestId}`).emit('new-message', {
        senderId,
        message,
        messageType,
        timestamp: new Date()
      });
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (data) => {
      const { requestId, location, message } = data;
      
      logger.warn(`Emergency alert for request ${requestId}:`, message);
      
      // Broadcast emergency to all relevant parties and nearby mechanics
      requestNamespace.emit('emergency-alert', {
        requestId,
        location,
        message,
        timestamp: new Date()
      });
    });

    // Handle request cancellation
    socket.on('cancel-request', (data) => {
      const { requestId, reason } = data;
      
      logger.info(`Request ${requestId} cancelled: ${reason}`);
      
      requestNamespace.to(`request_${requestId}`).emit('request-cancelled', {
        reason,
        timestamp: new Date()
      });
      
      // Notify available mechanics
      socket.to('available_mechanics').emit('request-cancelled', { requestId });
    });

    // Handle mechanic going offline
    socket.on('go-offline', (mechanicId) => {
      if (mechanicId) {
        socket.leave('available_mechanics');
        socket.leave(`mechanic_${mechanicId}`);
        logger.info(`Mechanic ${mechanicId} went offline`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected from requests namespace: ${socket.id}, reason: ${reason}`);
      
      if (socket.mechanicId) {
        socket.leave('available_mechanics');
        socket.leave(`mechanic_${socket.mechanicId}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Helper functions for external use
  const emitToUser = (userId, event, data) => {
    requestNamespace.to(`user_${userId}`).emit(event, data);
  };

  const emitToMechanic = (mechanicId, event, data) => {
    requestNamespace.to(`mechanic_${mechanicId}`).emit(event, data);
  };

  const emitToRequest = (requestId, event, data) => {
    requestNamespace.to(`request_${requestId}`).emit(event, data);
  };

  const emitToAvailableMechanics = (event, data) => {
    requestNamespace.to('available_mechanics').emit(event, data);
  };

  return {
    emitToUser,
    emitToMechanic,
    emitToRequest,
    emitToAvailableMechanics,
    requestNamespace
  };
};

module.exports = initializeRequestSocket;
