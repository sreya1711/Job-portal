import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';

import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import applicationRoutes from './routes/application.js';
import employerRoutes from './routes/employer.js';
import jobSeekerRoutes from './routes/jobSeeker.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import profileRoutes from './routes/profile.js';
import messagesRoutes from './routes/messages.js';
import interviewsRoutes from './routes/interviews.js';
import feedbackRoutes from './routes/feedback.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.warn('Socket connection attempt without token');
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to socket
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    console.log(`Socket authenticated: userId=${decoded.id}, role=${decoded.role}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error(`Authentication error: ${error.message}`));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.userRole})`);
  
  // Join a room with the user's ID for direct messages
  socket.join(socket.userId);
  
  // Join role-based rooms
  if (socket.userRole) {
    socket.join(`role:${socket.userRole}`);
  }
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
  
  // Handle joining application-specific rooms
  socket.on('join:application', (applicationId) => {
    if (applicationId) {
      socket.join(`application:${applicationId}`);
      console.log(`User ${socket.userId} joined application room: ${applicationId}`);
    }
  });
  
  // Handle leaving application-specific rooms
  socket.on('leave:application', (applicationId) => {
    if (applicationId) {
      socket.leave(`application:${applicationId}`);
      console.log(`User ${socket.userId} left application room: ${applicationId}`);
    }
  });
  
  // Notification events - these will be emitted by various controllers
  
  // When a new job is posted
  socket.on('notify:job-posted', (data) => {
    // Broadcast to all connected job seekers
    io.to(`role:jobseeker`).emit('new-job-posted', {
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      company: data.company,
      timestamp: new Date()
    });
  });
  
  // When application status is updated
  socket.on('notify:application-status', (data) => {
    // Send to specific user
    io.to(data.jobSeekerId).emit('application-status-update', {
      applicationId: data.applicationId,
      jobTitle: data.jobTitle,
      status: data.status,
      timestamp: new Date()
    });
  });
  
  // When skill match is calculated
  socket.on('notify:skill-match', (data) => {
    // Send to specific user
    io.to(data.jobSeekerId).emit('skill-match-update', {
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      matchPercentage: data.matchPercentage,
      timestamp: new Date()
    });
  });
  
  // When interview is scheduled
  socket.on('notify:interview-scheduled', (data) => {
    // Send to specific user
    io.to(data.jobSeekerId).emit('interview-scheduled', {
      applicationId: data.applicationId,
      jobTitle: data.jobTitle,
      date: data.date,
      time: data.time,
      timestamp: new Date()
    });
  });
});

app.set('io', io);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use(notFound);
app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err.message);
  errorHandler(err, req, res, next);
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();