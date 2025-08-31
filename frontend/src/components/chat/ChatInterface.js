import React, { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ConversationList from './ConversationList';
import ChatMessage from './ChatMessage';
import chatApi from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import socketService from '../../services/socketService';

const ChatInterface = ({ requestId = null }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    setupSocketListeners();
    
    return () => {
      // Cleanup socket listeners
      socketService.off('new-message');
    };
  }, []);

  // Auto-select conversation when requestId is provided
  useEffect(() => {
    if (requestId && conversations.length > 0) {
      const targetConversation = conversations.find(
        conv => conv.serviceRequest._id === requestId
      );
      if (targetConversation) {
        setSelectedConversation(targetConversation);
      }
    }
  }, [requestId, conversations]);

  const setupSocketListeners = () => {
    // Listen for new messages
    socketService.onNewMessage((data) => {
      if (selectedConversation && data.requestId === selectedConversation.serviceRequest._id) {
        setMessages(prev => [...prev, data]);
      }
    });
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.serviceRequest._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getConversations();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (serviceRequestId) => {
    try {
      const response = await chatApi.getMessages(serviceRequestId);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleConversationSelect = (conversation) => {
    // Leave previous request room if any
    if (selectedConversation) {
      socketService.leaveRequest(selectedConversation.serviceRequest._id);
    }
    
    setSelectedConversation(conversation);
    setMessages([]);
    
    // Join new request room for real-time updates
    if (conversation && conversation.serviceRequest) {
      socketService.joinRequest(conversation.serviceRequest._id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const messageData = {
        content: newMessage.trim(),
        messageType: 'text'
      };

      const response = await chatApi.sendMessage(
        selectedConversation.serviceRequest._id,
        messageData
      );

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        
        // Update conversation list to show new message
        fetchConversations();
        
        // Also send via socket for real-time delivery
        socketService.sendMessage(
          selectedConversation.serviceRequest._id,
          newMessage.trim(),
          user.role
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!selectedConversation) return null;
    
    if (user.role === 'customer') {
      return selectedConversation.mechanic;
    } else {
      return selectedConversation.customer;
    }
  };

  const getServiceRequestTitle = (serviceRequest) => {
    if (!serviceRequest) return 'Unknown Request';
    
    const issueTypes = {
      flat_tire: 'Flat Tire',
      battery_dead: 'Dead Battery',
      fuel_empty: 'Out of Fuel',
      engine_trouble: 'Engine Trouble',
      accident: 'Accident',
      key_locked: 'Keys Locked',
      overheating: 'Overheating',
      brake_failure: 'Brake Failure',
      transmission_issue: 'Transmission Issue',
      other: 'Other Issue'
    };
    
    return issueTypes[serviceRequest.issueType] || 'Service Request';
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border">
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
        <ConversationList
          conversations={conversations}
          loading={loading}
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?._id}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getOtherParticipant()?.name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getServiceRequestTitle(selectedConversation.serviceRequest)}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Status: {selectedConversation.serviceRequest?.status || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message._id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Attach file"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Send image"
                    >
                      <PhotoIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
