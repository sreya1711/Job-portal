import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Normalize base URL: strip trailing /api if present for Socket.IO endpoint
const RAW_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_SERVER = RAW_BASE.replace(/\/?api\/?$/, '');

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection to normalized server (no /api)
    const socketInstance = io(SOCKET_SERVER, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected (SocketContext)');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('message:new', (message) => {
      console.log('New message received:', message);
      setNotifications(prev => [message, ...prev]);
    });

    socketInstance.on('interview:scheduled', (data) => {
      console.log('Interview scheduled:', data);
      setNotifications(prev => [{
        type: 'interview',
        ...data,
        timestamp: new Date()
      }, ...prev]);
    });

    socketInstance.on('application:status', (data) => {
      console.log('Application status updated:', data);
      setNotifications(prev => [{
        type: 'status',
        ...data,
        timestamp: new Date()
      }, ...prev]);
    });

    socketInstance.on('feedback:new', (data) => {
      console.log('New feedback received:', data);
      setNotifications(prev => [{
        type: 'feedback',
        ...data,
        timestamp: new Date()
      }, ...prev]);
    });

    // Save socket instance
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value = {
    socket,
    connected,
    notifications,
    clearNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};