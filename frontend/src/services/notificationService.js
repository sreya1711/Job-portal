import io from 'socket.io-client';
import { toast } from 'react-toastify';

// Derive socket server from API URL but strip trailing /api
const RAW_BASE = process.env.REACT_APP_API_URL || 'https://job-portal-wwfk.onrender.com';
const SOCKET_SERVER = RAW_BASE.replace(/\/?api\/?$/, '');

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(userId) {
    if (this.socket?.connected) return;

    // Get auth token from localStorage
    const token = localStorage.getItem('token');

    this.socket = io(SOCKET_SERVER, {
      auth: {
        token: token || '',
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Interview updates (confirm/cancel/complete)
    this.socket.on('interview:updated', (data) => {
      try {
        toast.info(`Interview ${data.status}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } catch (e) {}
      this.emit('interview-updated', data);
    });

    this.socket.on('connect', () => {
      console.log('Notification service connected');
      this.emit('connected', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Notification service disconnected');
      this.emit('disconnected', {});
    });

    // Listen for real-time notifications
    this.socket.on('new-job-posted', (data) => {
      this.handleNewJobPosted(data);
    });

    this.socket.on('application-status-update', (data) => {
      try { console.log('[socket] application-status-update', data); } catch {}
      this.handleApplicationStatusUpdate(data);
    });
    // Also support namespaced form emitted by server/controllers
    this.socket.on('application:status', (data) => {
      try { console.log('[socket] application:status', data); } catch {}
      this.handleApplicationStatusUpdate(data);
    });

    this.socket.on('skill-match-update', (data) => {
      this.handleSkillMatchUpdate(data);
    });

    this.socket.on('new-message', (data) => {
      this.handleNewMessage(data);
    });
    this.socket.on('message:new', (data) => {
      this.handleNewMessage(data);
    });

    // Some backends emit with hyphen, others with colon
    this.socket.on('interview-scheduled', (data) => {
      this.handleInterviewScheduled(data);
    });
    this.socket.on('interview:scheduled', (data) => {
      this.handleInterviewScheduled(data);
    });

    this.socket.on('application:submitted', (data) => {
      this.handleApplicationSubmitted(data);
    });
    this.socket.on('application:new', (data) => {
      this.handleApplicationSubmitted(data);
    });

    // Profile updated by counterpart
    this.socket.on('profile:updated', (data) => {
      try { console.log('[socket] profile:updated', data); } catch {}
      try {
        const who = data.actorRole === 'employer' ? 'Employer' : 'Candidate';
        toast.info(`${who} updated profile`, { position: 'top-right', autoClose: 4000 });
      } catch (e) {}
      this.emit('profile-updated', data);
    });

    // Feedback events
    this.socket.on('feedback:new', (data) => {
      try {
        toast.info(`New feedback on ${data.jobTitle || 'your application'}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } catch (e) {
        console.warn('Toast failed in feedback:new:', e?.message || e);
      }
      this.emit('feedback-received', data);
    });

    this.socket.on('analytics-updated', (data) => {
      console.log('Analytics updated:', data);
      this.emit('analytics-updated', data);
    });

    this.socket.on('revenue-updated', (data) => {
      console.log('Revenue updated:', data);
      this.emit('revenue-updated', data);
    });

    this.socket.on('user-registered', (data) => {
      console.log('User registered:', data);
      this.emit('user-registered', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Log detailed error info
      if (typeof error === 'string') {
        console.error('Socket error message:', error);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }

  handleNewJobPosted(data) {
    const message = `New job posted: ${data.jobTitle} at ${data.company}`;
    toast.info(message, {
      position: 'top-right',
      autoClose: 5000,
    });
    this.emit('job-posted', data);
  }

  handleApplicationStatusUpdate(data) {
    const statusMessages = {
      'under-review': '📋 Your application is under review',
      'shortlisted': '✅ Congratulations! You\'ve been shortlisted',
      'rejected': '❌ Your application was not selected',
      'interview-scheduled': '📅 Interview scheduled for this application',
    };

    const message = statusMessages[data.status] || `Application status: ${data.status}`;
    const type = data.status === 'rejected' ? 'error' : 'success';
    
    toast[type](message, {
      position: 'top-right',
      autoClose: 5000,
    });
    this.emit('application-updated', data);
  }

  handleSkillMatchUpdate(data) {
    const message = `Your skills match ${data.matchPercentage}% of the job requirements for "${data.jobTitle}"`;
    toast.info(message, {
      position: 'top-right',
      autoClose: 5000,
    });
    this.emit('skill-match', data);
  }

  handleNewMessage(data) {
    toast.info(`New message from ${data.senderName}`, {
      position: 'top-right',
      autoClose: 5000,
    });
    this.emit('message-received', data);
  }

  handleInterviewScheduled(data) {
    toast.success(
      `Interview scheduled on ${new Date(data.date).toLocaleDateString()} at ${data.time}`,
      {
        position: 'top-right',
        autoClose: 5000,
      }
    );
    this.emit('interview-scheduled', data);
  }

  // Handle application submitted (typically for employers)
  handleApplicationSubmitted(data) {
    const title = data?.jobTitle || 'a job you posted';
    try {
      toast.info(`New application submitted for ${title}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    } catch (e) {
      console.warn('Toast failed in handleApplicationSubmitted:', e?.message || e);
    }
    this.emit('application-submitted', data);
  }

  // Custom event emitter methods
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Emit events through socket
  emitToServer(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new NotificationService();
