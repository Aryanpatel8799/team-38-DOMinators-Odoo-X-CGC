const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validate, schemas } = require('../middlewares/validationMiddleware');

// Apply authentication to all chat routes
router.use(authenticateToken);

// Chat conversation routes
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:serviceRequestId', chatController.getOrCreateConversation);

// Direct chat route
router.post('/direct-chat', chatController.createDirectChat);

// Message routes
router.get('/conversations/:serviceRequestId/messages', chatController.getMessages);
router.post('/conversations/:serviceRequestId/messages', validate(schemas.sendMessage), chatController.sendMessage);

// Read status routes
router.post('/conversations/:serviceRequestId/read', chatController.markAsRead);

module.exports = router;
