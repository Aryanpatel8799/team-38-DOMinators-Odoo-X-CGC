const Chat = require('../models/Chat');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../config/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         sender:
 *           type: string
 *           description: User ID of the message sender
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, image, file]
 *           description: Type of message
 *         fileUrl:
 *           type: string
 *           description: URL of attached file (if any)
 *         isRead:
 *           type: boolean
 *           description: Whether the message has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         serviceRequest:
 *           type: string
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *         customer:
 *           type: string
 *         mechanic:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get user's chat conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chat'
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    logger.info('Getting conversations for user:', { userId, userRole: req.user.role });
    
    const conversations = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name')
    .sort({ updatedAt: -1 });

    logger.info('Found conversations:', { 
      count: conversations.length,
      conversationIds: conversations.map(c => c._id)
    });

    // Add unread count for each conversation
    const conversationsWithUnreadCount = conversations.map(chat => {
      const unreadCount = chat.messages.filter(msg => 
        !msg.isRead && msg.sender._id.toString() !== userId
      ).length;
      
      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    logger.info('Conversations retrieved successfully', { 
      userId, 
      conversationCount: conversationsWithUnreadCount.length 
    });
    
    return sendSuccessResponse(res, 200, 'Conversations retrieved successfully', conversationsWithUnreadCount);
  } catch (error) {
    logger.error('Error getting conversations:', error);
    return sendErrorResponse(res, 500, 'Failed to get conversations');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}:
 *   get:
 *     summary: Get or create chat conversation for a service request
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat conversation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chat'
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;

    // Verify service request exists and user has access
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return sendErrorResponse(res, 404, 'Service request not found');
    }

    // Check if user is authorized to access this chat
    const isCustomer = serviceRequest.customer.toString() === userId;
    const isMechanic = serviceRequest.mechanic && serviceRequest.mechanic.toString() === userId;
    
    if (!isCustomer && !isMechanic) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    })
    .populate('customer', 'name email phone')
    .populate('mechanic', 'name email phone')
    .populate('serviceRequest', 'issueType description status')
    .populate('messages.sender', 'name');

    if (!chat) {
      // Create new chat conversation
      chat = new Chat({
        participants: [serviceRequest.customer, serviceRequest.mechanic],
        serviceRequest: serviceRequestId,
        customer: serviceRequest.customer,
        mechanic: serviceRequest.mechanic,
        messages: []
      });

      await chat.save();
      
      // Populate the newly created chat
      chat = await Chat.findById(chat._id)
        .populate('customer', 'name email phone')
        .populate('mechanic', 'name email phone')
        .populate('serviceRequest', 'issueType description status')
        .populate('messages.sender', 'name');
    }

    // Mark messages as read for the current user
    await chat.markAsRead(userId);

    logger.info('Chat conversation retrieved/created successfully', { 
      userId, 
      serviceRequestId, 
      chatId: chat._id 
    });

    return sendSuccessResponse(res, 200, 'Chat conversation retrieved successfully', chat);
  } catch (error) {
    logger.error('Error getting/creating chat conversation:', error);
    return sendErrorResponse(res, 500, 'Failed to get chat conversation');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/messages:
 *   post:
 *     summary: Send a message in a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 required: true
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *               fileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;
    const { content, messageType = 'text', fileUrl } = req.body;

    logger.info('Attempting to send message:', {
      userId,
      serviceRequestId,
      content: content ? content.substring(0, 50) + '...' : 'empty',
      messageType
    });

    if (!content || content.trim().length === 0) {
      return sendErrorResponse(res, 400, 'Message content is required');
    }

    // Get or create chat conversation
    let chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (!chat) {
      logger.error('Chat conversation not found:', { serviceRequestId });
      return sendErrorResponse(res, 404, 'Chat conversation not found');
    }

    logger.info('Found chat conversation:', { chatId: chat._id, participants: chat.participants });

    // Verify user is a participant (handle both string and ObjectId comparison)
    const isParticipant = chat.participants.some(participant => 
      participant.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      logger.error('User not a participant:', { 
        userId, 
        userIdType: typeof userId,
        participants: chat.participants.map(p => ({ id: p.toString(), type: typeof p })),
        isParticipant 
      });
      return sendErrorResponse(res, 403, 'Access denied');
    }

    // Add message to chat
    logger.info('Adding message to chat...');
    let message;
    try {
      message = await chat.addMessage(userId, content.trim(), messageType, fileUrl);
      logger.info('Message added successfully:', { messageId: message._id });
    } catch (addMessageError) {
      logger.error('Error in addMessage:', addMessageError);
      throw addMessageError;
    }

    // Populate sender information
    try {
      await message.populate('sender', 'name');
      logger.info('Message populated successfully');
    } catch (populateError) {
      logger.error('Error populating message:', populateError);
      // Continue without population rather than failing
    }

    logger.info('Message sent successfully', { 
      userId, 
      serviceRequestId, 
      messageId: message._id 
    });

    return sendSuccessResponse(res, 200, 'Message sent successfully', message);
  } catch (error) {
    logger.error('Error sending message:', error);
    logger.error('Error stack:', error.stack);
    return sendErrorResponse(res, 500, 'Failed to send message');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/messages:
 *   get:
 *     summary: Get messages from a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get chat conversation
    const chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat conversation not found');
    }

    // Verify user is a participant
    if (!chat.participants.includes(userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    // Mark messages as read
    await chat.markAsRead(userId);

    // Get messages with pagination
    const messages = await Chat.aggregate([
      { $match: { _id: chat._id } },
      { $unwind: '$messages' },
      { $sort: { 'messages.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $sort: { 'messages.createdAt': 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'messages.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $addFields: {
          'messages.sender': { $arrayElemAt: ['$senderInfo', 0] }
        }
      },
      { $project: { messages: 1 } }
    ]);

    const totalMessages = chat.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);

    const response = {
      messages: messages.map(m => m.messages),
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: totalPages
      }
    };

    logger.info('Messages retrieved successfully', { 
      userId, 
      serviceRequestId, 
      page, 
      limit 
    });

    return sendSuccessResponse(res, 200, 'Messages retrieved successfully', response);
  } catch (error) {
    logger.error('Error getting messages:', error);
    return sendErrorResponse(res, 500, 'Failed to get messages');
  }
};

/**
 * @swagger
 * /api/chat/direct-chat:
 *   post:
 *     summary: Create a direct chat conversation with a mechanic
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mechanicId:
 *                 type: string
 *                 required: true
 *               serviceRequestData:
 *                 type: object
 *                 properties:
 *                   issueType:
 *                     type: string
 *                   description:
 *                     type: string
 *                   location:
 *                     type: object
 *                   vehicleInfo:
 *                     type: object
 *     responses:
 *       200:
 *         description: Direct chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Chat'
 */
const createDirectChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mechanicId, serviceRequestData } = req.body;

    if (!mechanicId) {
      return sendErrorResponse(res, 400, 'Mechanic ID is required');
    }

    // Verify mechanic exists and is active
    const mechanic = await User.findOne({ _id: mechanicId, role: 'mechanic', isActive: true });
    if (!mechanic) {
      return sendErrorResponse(res, 404, 'Mechanic not found or inactive');
    }

    // Create a temporary service request for direct chat
    const serviceRequest = new ServiceRequest({
      customerId: userId,
      mechanicId: mechanicId,
      issueType: serviceRequestData.issueType || 'other',
      description: serviceRequestData.description || 'Direct chat conversation',
      location: serviceRequestData.location || { lat: 0, lng: 0, address: 'Direct Chat' },
      vehicleInfo: serviceRequestData.vehicleInfo || { type: 'other', model: 'N/A', plate: 'N/A' },
      status: 'pending',
      isDirectChat: true,
      priority: 'low'
    });

    await serviceRequest.save();

    // Create chat conversation
    const chat = new Chat({
      participants: [userId, mechanicId],
      serviceRequest: serviceRequest._id,
      customer: userId,
      mechanic: mechanicId,
      messages: []
    });

    await chat.save();

    // Populate the chat with user information
    const populatedChat = await Chat.findById(chat._id)
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name email phone')
      .populate('serviceRequest', 'issueType description status')
      .populate('messages.sender', 'name');

    logger.info('Direct chat created successfully', { 
      userId, 
      mechanicId, 
      serviceRequestId: serviceRequest._id,
      chatId: chat._id 
    });

    return sendSuccessResponse(res, 200, 'Direct chat created successfully', populatedChat);
  } catch (error) {
    logger.error('Error creating direct chat:', error);
    return sendErrorResponse(res, 500, 'Failed to create direct chat');
  }
};

/**
 * @swagger
 * /api/chat/conversations/{serviceRequestId}/read:
 *   post:
 *     summary: Mark messages as read in a chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     readCount:
 *                       type: integer
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceRequestId } = req.params;

    const chat = await Chat.findOne({
      serviceRequest: serviceRequestId,
      isActive: true
    });

    if (!chat) {
      return sendErrorResponse(res, 404, 'Chat conversation not found');
    }

    // Verify user is a participant
    if (!chat.participants.includes(userId)) {
      return sendErrorResponse(res, 403, 'Access denied');
    }

    const readCount = await chat.markAsRead(userId);

    logger.info('Messages marked as read', { 
      userId, 
      serviceRequestId, 
      readCount 
    });

    return sendSuccessResponse(res, 200, 'Messages marked as read successfully', { readCount });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    return sendErrorResponse(res, 500, 'Failed to mark messages as read');
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  createDirectChat
};
