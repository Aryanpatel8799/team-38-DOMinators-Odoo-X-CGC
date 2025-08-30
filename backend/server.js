require('dotenv').config();

const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const { connectDB } = require('./src/config/database');
const logger = require('./src/config/logger');
const { gracefulShutdown } = require('./src/middlewares/errorMiddleware');

// Socket.IO imports
const requestSocket = require('./src/socket/requestSocket');

// Environment validation
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize Socket handlers
requestSocket(io);

// Make io available to other modules
app.set('io', io);

// Connect to Database
connectDB().then(() => {
  const PORT = process.env.PORT || 4000;
  
  server.listen(PORT, () => {
    logger.info(`🚀 RoadGuard API Server running on port ${PORT}`);
    logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    
    // Log available endpoints
    logger.info('Available endpoints:');
    logger.info('  Authentication: /api/auth');
    logger.info('  Customer APIs: /api/customer');
    logger.info('  Mechanic APIs: /api/mechanic');
    logger.info('  Admin APIs: /api/admin');
    logger.info('  Payment APIs: /api/payments');
    
    // Log Socket.IO status
    logger.info('🔌 Socket.IO server initialized');
    logger.info('  Real-time features: Service requests, Location tracking, Status updates');
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    logger.debug('Client connected:', socket.id);
    
    socket.on('disconnect', (reason) => {
      logger.debug('Client disconnected:', {
        socketId: socket.id,
        reason
      });
    });

    socket.on('error', (error) => {
      logger.error('Socket error:', {
        socketId: socket.id,
        error: error.message
      });
    });
  });

  // Schedule cleanup tasks
  setInterval(async () => {
    try {
      // Clean up expired OTPs
      const OTP = require('./src/models/OTP');
      const cleanedOTPs = await OTP.cleanup();
      if (cleanedOTPs > 0) {
        logger.info(`Cleaned up ${cleanedOTPs} expired OTPs`);
      }

      // Clean up old upload files
      const uploadService = require('./src/services/uploadService');
      const cleanedFiles = await uploadService.cleanupTempFiles();
      if (cleanedFiles > 0) {
        logger.info(`Cleaned up ${cleanedFiles} temporary files`);
      }

      // Clean up old export files
      const csvExportService = require('./src/utils/csvExport');
      const cleanedExports = await csvExportService.cleanupOldExports();
      if (cleanedExports > 0) {
        logger.info(`Cleaned up ${cleanedExports} old export files`);
      }

    } catch (error) {
      logger.error('Cleanup task failed:', error);
    }
  }, 60 * 60 * 1000); // Run every hour

  // Setup graceful shutdown handlers
  gracefulShutdown(server, io);

}).catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Export server for testing
module.exports = server;
