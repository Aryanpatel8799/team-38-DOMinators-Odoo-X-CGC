import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const isOwnMessage = message.sender._id === user.id;

  const getMessageTypeIcon = (messageType) => {
    switch (messageType) {
      case 'image':
        return '📷';
      case 'file':
        return '📎';
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    if (message.messageType === 'image') {
      return (
        <div>
          <img 
            src={message.fileUrl} 
            alt="Shared image" 
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          {message.content && (
            <p className="mt-2 text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.messageType === 'file') {
      return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
          <span className="text-lg">📎</span>
          <div>
            <p className="text-sm font-medium">File attached</p>
            <a 
              href={message.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View file
            </a>
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {renderMessageContent()}
        </div>
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
          isOwnMessage ? 'justify-end' : 'justify-start'
        }`}>
          <span>{message.sender.name}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
          {isOwnMessage && (
            <>
              <span>•</span>
              <span>{message.isRead ? '✓✓' : '✓'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
