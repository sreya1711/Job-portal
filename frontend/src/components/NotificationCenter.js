import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import notificationService from '../services/notificationService';

// Controlled props (optional):
// - notifications: external notifications list
// - unreadCount: external unread counter
// - onMarkAsRead: fn(id)
// - onClearAll: fn()
// - userId: used only for unmanaged mode to connect socket
const NotificationCenter = ({ userId, notifications: extNotifications, unreadCount: extUnreadCount, onMarkAsRead, onClearAll }) => {
  const controlled = Array.isArray(extNotifications);
  const [notifications, setNotifications] = useState(controlled ? extNotifications : []);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(controlled ? extUnreadCount : 0);

  useEffect(() => {
    if (controlled) return; // In controlled mode, skip internal listeners

    // Connect notification service (token-based). userId is optional.
    notificationService.connect(userId);

    // Listen for various notification types
    const handleJobPosted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'job-posted',
        title: 'New Job Posted',
        message: `${data.jobTitle} at ${data.company}`,
        icon: '💼',
        read: false,
      });
    };

    const handleApplicationUpdated = (data) => {
      const icons = {
        'under-review': '📋',
        'shortlisted': '✅',
        'rejected': '❌',
        'interview-scheduled': '📅',
      };
      
      addNotification({
        id: Date.now(),
        type: 'application-updated',
        title: `Application ${data.status}`,
        message: data.jobTitle || 'Your application status has been updated',
        icon: icons[data.status] || '📝',
        read: false,
      });
    };

    const handleSkillMatch = (data) => {
      addNotification({
        id: Date.now(),
        type: 'skill-match',
        title: 'Skill Match Alert',
        message: `${data.matchPercentage}% match for "${data.jobTitle}"`,
        icon: '⭐',
        read: false,
      });
    };

    const handleMessageReceived = (data) => {
      addNotification({
        id: Date.now(),
        type: 'message',
        title: 'New Message',
        message: `From: ${data.senderName}`,
        icon: '💬',
        read: false,
      });
    };

    const handleInterviewScheduled = (data) => {
      addNotification({
        id: Date.now(),
        type: 'interview',
        title: 'Interview Scheduled',
        message: `${new Date(data.date).toLocaleDateString()} at ${data.time}`,
        icon: '📅',
        read: false,
      });
    };

    const handleApplicationSubmitted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'application-submitted',
        title: 'New Application',
        message: `${data.jobSeekerName || 'A candidate'} applied for ${data.jobTitle || 'your job'}`,
        icon: '📝',
        read: false,
      });
    };

    const handleInterviewUpdated = (data) => {
      addNotification({
        id: Date.now(),
        type: 'interview-updated',
        title: 'Interview Updated',
        message: `${data.status || 'updated'} at ${new Date(data.updatedAt || Date.now()).toLocaleString()}`,
        icon: '🗓️',
        read: false,
      });
    };

    const handleProfileUpdated = (data) => {
      const who = data.actorRole === 'employer' ? 'Employer' : 'Candidate';
      addNotification({
        id: Date.now(),
        type: 'profile-updated',
        title: `${who} Profile Updated`,
        message: data.name ? `${who} updated profile: ${data.name}` : `${who} updated profile`,
        icon: '👤',
        read: false,
      });
    };

    notificationService.on('job-posted', handleJobPosted);
    notificationService.on('application-updated', handleApplicationUpdated);
    notificationService.on('skill-match', handleSkillMatch);
    notificationService.on('message-received', handleMessageReceived);
    notificationService.on('interview-scheduled', handleInterviewScheduled);
    notificationService.on('application-submitted', handleApplicationSubmitted);
    notificationService.on('interview-updated', handleInterviewUpdated);
    notificationService.on('profile-updated', handleProfileUpdated);

    return () => {
      notificationService.off('job-posted', handleJobPosted);
      notificationService.off('application-updated', handleApplicationUpdated);
      notificationService.off('skill-match', handleSkillMatch);
      notificationService.off('message-received', handleMessageReceived);
      notificationService.off('interview-scheduled', handleInterviewScheduled);
      notificationService.off('application-submitted', handleApplicationSubmitted);
      notificationService.off('interview-updated', handleInterviewUpdated);
      notificationService.off('profile-updated', handleProfileUpdated);
    };
  }, [userId, controlled]);

  // If controlled, mirror external props into local render variables
  const renderNotifications = controlled ? extNotifications : notifications;
  const renderUnreadCount = controlled ? (extUnreadCount || 0) : unreadCount;

  const addNotification = (notification) => {
    if (controlled) return onMarkAsRead?.(notification.id);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const removeNotification = (id) => {
    if (controlled) return onMarkAsRead?.(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    if (controlled) return onMarkAsRead?.(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    if (controlled) return onClearAll?.();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative inline-block z-50">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {renderUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
            {renderUnreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 border-b p-4 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex gap-2">
              {renderNotifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {renderNotifications.length > 0 ? (
            <div className="divide-y">
              {renderNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    !notif.read ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Just now
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell size={40} className="mx-auto mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;