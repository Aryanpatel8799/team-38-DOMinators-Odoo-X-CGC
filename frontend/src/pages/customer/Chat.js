import React from 'react';
import ChatInterface from '../../components/chat/ChatInterface';

const Chat = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">
          Chat with mechanics about your service requests
        </p>
      </div>
      
      <div className="h-[600px]">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat;
