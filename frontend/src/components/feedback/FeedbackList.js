import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { MessageSquare, Star, Building, Briefcase } from 'lucide-react';
import axios from 'axios';

const FeedbackList = () => {
  const { socket } = useSocket();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch feedback
  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/feedback/my');
      
      // Sort by date (newest first)
      const sortedFeedback = response.data.feedback.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setFeedback(sortedFeedback);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFeedback();
  }, []);

  // Listen for new feedback
  useEffect(() => {
    if (socket) {
      socket.on('feedback:new', (newFeedback) => {
        setFeedback(prev => {
          // Check if this feedback is already in the list
          const exists = prev.some(f => f._id === newFeedback.id);
          if (exists) return prev;
          
          // Add new feedback and sort
          return [newFeedback, ...prev].sort((a, b) => {
            return new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp);
          });
        });
      });
      
      return () => {
        socket.off('feedback:new');
      };
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/feedback/${id}/read`);
      
      // Update local state
      setFeedback(prev => 
        prev.map(item => 
          item._id === id 
            ? { ...item, read: true } 
            : item
        )
      );
    } catch (err) {
      console.error('Error marking feedback as read:', err);
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">Employer Feedback</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        ) : feedback.length > 0 ? (
          feedback.map((item) => (
            <div 
              key={item._id || item.id} 
              className={`p-4 hover:bg-gray-50 ${!item.read ? 'bg-blue-50' : ''}`}
              onClick={() => !item.read && markAsRead(item._id || item.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">
                        {item.sender?.name || item.senderName}
                      </h4>
                      {!item.read && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {item.content}
                    </div>
                    
                    {item.rating && (
                      <div className="mt-2">
                        {renderStars(item.rating)}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        <span>{item.job?.company || 'Company'}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-3 w-3 mr-1" />
                        <span>{item.job?.title || item.jobTitle || 'Job'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createdAt || item.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No feedback received yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;