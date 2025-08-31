import apiClient from './apiClient';

class ChatApi {
  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await apiClient.get('/chat/conversations');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get conversations' };
    }
  }

  // Get or create a conversation for a specific service request
  async getOrCreateConversation(serviceRequestId) {
    try {
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get conversation' };
    }
  }

  // Get messages from a conversation with pagination
  async getMessages(serviceRequestId, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get messages' };
    }
  }

  // Send a message
  async sendMessage(serviceRequestId, messageData) {
    try {
      const response = await apiClient.post(`/chat/conversations/${serviceRequestId}/messages`, messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  }

  // Mark messages as read
  async markAsRead(serviceRequestId) {
    try {
      const response = await apiClient.post(`/chat/conversations/${serviceRequestId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark messages as read' };
    }
  }

  // Create a direct chat conversation
  async createDirectChat(mechanicId, serviceRequestData) {
    try {
      const response = await apiClient.post('/chat/direct-chat', {
        mechanicId,
        serviceRequestData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create direct chat' };
    }
  }
}

const chatApi = new ChatApi();
export default chatApi;
