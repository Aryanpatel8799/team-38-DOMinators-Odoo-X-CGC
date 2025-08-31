import React from 'react';
import { ChatBubbleLeftIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ conversations, loading, onConversationSelect, selectedConversationId }) => {
  const { user } = useAuth();

  const getOtherParticipant = (conversation) => {
    if (user.role === 'customer') {
      return conversation.mechanic;
    } else {
      return conversation.customer;
    }
  };

  const getLastMessage = (conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[conversation.messages.length - 1];
    }
    return null;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-500">
          Start a conversation by creating a service request or accepting one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const lastMessage = getLastMessage(conversation);
        const isSelected = selectedConversationId === conversation._id;
        
        return (
          <div
            key={conversation._id}
            onClick={() => onConversationSelect(conversation)}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-primary-50 border-primary-200' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {otherParticipant?.name || 'Unknown User'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {getServiceRequestTitle(conversation.serviceRequest)}
                  </p>
                </div>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            
            {lastMessage && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate flex-1">
                  {lastMessage.content}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400 ml-2">
                  <ClockIcon className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              Status: {conversation.serviceRequest?.status || 'Unknown'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
