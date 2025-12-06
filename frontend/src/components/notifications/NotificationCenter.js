import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Bell, MessageCircle, Calendar, ThumbsUp } from 'lucide-react';
import axios from 'axios';

const NotificationCenter = () => {
  const { notifications, clearNotification } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch messages
        const messagesRes = await axios.get('/api/messages/my');
        const messages = messagesRes.data.messages.map(msg => ({
          id: msg._id,
          type: 'message',
          content: msg.content,
          senderName: msg.sender.name,
          senderRole: msg.sender.role,
          timestamp: new Date(msg.createdAt),
          read: msg.read,
          applicationId: msg.application?._id,
          jobTitle: msg.application?.job?.title
        }));

        // Fetch interviews
        const interviewsRes = await axios.get('/api/interviews/my');
        const interviews = interviewsRes.data.interviews.map(interview => ({
          id: interview._id,
          type: 'interview',
          content: `Interview scheduled for ${new Date(interview.date).toLocaleDateString()} at ${interview.time}`,
          senderName: interview.employer.name,
          senderRole: 'employer',
          timestamp: new Date(interview.createdAt),
          read: false,
          applicationId: interview.application,
          jobTitle: interview.job.title,
          location: interview.location,
          interviewType: interview.type
        }));

        // Fetch feedback
        const feedbackRes = await axios.get('/api/feedback/my');
        const feedback = feedbackRes.data.feedback.map(fb => ({
          id: fb._id,
          type: 'feedback',
          content: fb.content,
          senderName: fb.sender.name,
          senderRole: fb.sender.role,
          timestamp: new Date(fb.createdAt),
          read: fb.read,
          applicationId: fb.application,
          jobTitle: fb.job.title,
          rating: fb.rating
        }));

        // Combine and sort by timestamp (newest first)
        const combined = [...messages, ...interviews, ...feedback]
          .sort((a, b) => b.timestamp - a.timestamp);

        setAllNotifications(combined);
        setUnreadCount(combined.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Update notifications when new ones arrive via socket
  useEffect(() => {
    if (notifications.length > 0) {
      // Add new notifications to the list
      const newNotifications = notifications.map(notification => ({
        ...notification,
        read: false,
        timestamp: new Date(notification.timestamp || new Date())
      }));

      setAllNotifications(prev => 
        [...newNotifications, ...prev]
          .sort((a, b) => b.timestamp - a.timestamp)
      );
      
      // Update unread count
      setUnreadCount(prev => prev + newNotifications.length);
    }
  }, [notifications]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id, type) => {
    try {
      // Update on server based on notification type
      if (type === 'message') {
        await axios.put(`/api/messages/${id}/read`);
      } else if (type === 'feedback') {
        await axios.put(`/api/feedback/${id}/read`);
      }

      // Update local state
      setAllNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Clear from socket notifications if present
      clearNotification(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-5 w-5 text-green-500" />;
      case 'feedback':
        return <ThumbsUp className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button 
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 px-3 bg-gray-100 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : allNotifications.length > 0 ? (
              allNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  onClick={() => markAsRead(notification.id, notification.type)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.senderName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.type === 'message' && (
                          <span>Message: {notification.content}</span>
                        )}
                        {notification.type === 'interview' && (
                          <span>Interview scheduled for {notification.jobTitle}</span>
                        )}
                        {notification.type === 'feedback' && (
                          <span>Feedback: {notification.content}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.jobTitle && `Re: ${notification.jobTitle}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
          
          <div className="py-2 px-3 bg-gray-100 text-xs text-center text-gray-500">
            Click on a notification to mark it as read
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;