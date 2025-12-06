import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, RefreshCw } from 'lucide-react';
import axios from 'axios';

const MessageCenter = ({ applicationId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch messages for this application
  const fetchMessages = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/messages/application/${applicationId}`);
      if (response.data.messages) {
        setMessages(response.data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [applicationId]);

  useEffect(() => {
    if (socket && applicationId) {
      socket.emit('join:application', applicationId);
      
      const handleNewMessage = (message) => {
        if (message.applicationId.toString() === applicationId || message.applicationId === applicationId) {
          setMessages(prev => {
            const messageExists = prev.some(m => m._id === message._id);
            return messageExists ? prev : [...prev, message];
          });
        }
      };
      
      socket.on('message:new', handleNewMessage);
      
      return () => {
        socket.emit('leave:application', applicationId);
        socket.off('message:new', handleNewMessage);
      };
    }
  }, [socket, applicationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !applicationId) return;
    
    try {
      await axios.post(`/api/messages`, {
        applicationId,
        content: newMessage
      });
      
      setNewMessage('');
      
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  if (!applicationId) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Select an application to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Messages</h3>
          <button 
            onClick={fetchMessages}
            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Refresh messages"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => {
              if (!message || !message.content) {
                return null;
              }
              
              const senderId = message.sender?._id || message.sender;
              const isCurrentUser = senderId === user.id;
              
              return (
                <div 
                  key={message._id || `msg-${index}-${Date.now()}`} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(message.createdAt || message.sentAt || Date.now()).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <p className="text-xs mt-1 opacity-50">
                      {isCurrentUser ? 'You' : message.sender?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-4">No messages yet</p>
            <p className="text-sm text-gray-400">
              Send a message to start the conversation or use the "Create Test Message" button above.
            </p>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageCenter;