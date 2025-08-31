import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import chatApi from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ChatModal = ({ isOpen, onClose, mechanic, serviceRequestId = null }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && mechanic) {
      initializeChat();
    }
  }, [isOpen, mechanic, serviceRequestId]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // If we have a service request ID, try to get existing conversation
      if (serviceRequestId) {
        const response = await chatApi.getOrCreateConversation(serviceRequestId);
        if (response.success) {
          setConversation(response.data);
          setMessages(response.data.messages || []);
        }
      } else {
        // For direct chat, we need to create a temporary service request first
        // This ensures the chat is stored in the database
        try {
          // Create a temporary service request for direct chat
          const tempServiceRequest = {
            customer: user.id,
            mechanic: mechanic._id,
            issueType: 'other',
            description: `Direct chat initiated with ${mechanic.name}`,
            location: { lat: 0, lng: 0, address: 'Direct Chat' },
            vehicleInfo: { type: 'other', model: 'N/A', plate: 'N/A' },
            status: 'pending',
            isDirectChat: true // Flag to identify direct chats
          };
          
          // We'll create this through the API
          const response = await chatApi.createDirectChat(mechanic._id, tempServiceRequest);
          if (response.success) {
            setConversation(response.data);
            setMessages(response.data.messages || []);
          } else {
            // Fallback to demo chat if API fails
            setConversation({
              _id: 'temp-' + Date.now(),
              customer: user,
              mechanic: mechanic,
              messages: []
            });
            toast.info('Demo mode: Messages will not be saved. Create a service request for persistent chat.');
          }
        } catch (error) {
          console.error('Error creating direct chat:', error);
          // Fallback to demo chat
          setConversation({
            _id: 'temp-' + Date.now(),
            customer: user,
            mechanic: mechanic,
            messages: []
          });
          toast.info('Demo mode: Messages will not be saved. Create a service request for persistent chat.');
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      
      // Check if we have a real conversation with service request ID
      const currentServiceRequestId = conversation.serviceRequest?._id || serviceRequestId;
      
      if (currentServiceRequestId && currentServiceRequestId !== 'temp-' + Date.now()) {
        // Send message through API
        const messageData = {
          content: newMessage.trim(),
          messageType: 'text'
        };

        const response = await chatApi.sendMessage(currentServiceRequestId, messageData);
        if (response.success) {
          setMessages(prev => [...prev, response.data]);
          setNewMessage('');
        } else {
          throw new Error(response.message || 'Failed to send message');
        }
      } else {
        // For demo chat, just add to local state
        const tempMessage = {
          _id: Date.now(),
          sender: user,
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        
        // Show info that this is a demo chat
        toast.info('Demo mode: Messages are not saved. Create a service request for persistent chat.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const isOwnMessage = (message) => {
    return message.sender._id === user.id || message.sender.id === user.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {mechanic?.name?.charAt(0) || 'M'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Chat with {mechanic?.name}</h3>
              <p className="text-sm text-gray-500">
                {serviceRequestId ? 'Service Request Chat' : 'Direct Chat'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
              {!serviceRequestId && (
                <p className="text-sm text-gray-400 mt-2">
                  This is a demo chat. Create a service request for a real conversation.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage(message)
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                      isOwnMessage(message) ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{message.sender?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending || loading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
