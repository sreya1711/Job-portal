import express from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middleware/auth.js';
import Application from '../models/Application.js';
import { 
  applyForJob, 
  getApplicationsForJob, 
  getMyApplications, 
  updateApplicationStatus,
  scheduleInterview,
  getApplicationById
} from '../controllers/applicationController.js';

const router = express.Router({ mergeParams: true });

// All routes in this file are prefixed with /api

// Apply for a job
router.post(
  '/',
  authRequired,
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
  ],
  applyForJob,
);

// Get all applications by a specific job seeker (must come before /job/:jobId)
router.get('/jobseeker/my-applications', authRequired, getMyApplications);

// Get applications for a specific job (Employer)
router.get('/job/:jobId', authRequired, getApplicationsForJob);

// Update application status (Employer/Admin)
router.put('/status/:id', authRequired, updateApplicationStatus);

// Schedule an interview
router.post(
  '/schedule',
  authRequired,
  [
    body('applicationId').notEmpty().withMessage('Application ID is required'),
    body('jobSeekerId').notEmpty().withMessage('Job seeker ID is required'),
    body('date').notEmpty().withMessage('Interview date is required'),
    body('time').notEmpty().withMessage('Interview time is required'),
    body('location').notEmpty().withMessage('Interview location is required'),
  ],
  scheduleInterview
);



// Get a specific application by ID
router.get('/:id', authRequired, getApplicationById);

// Test endpoint to create a message (for debugging only)
router.post('/test-message/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { content = "This is a test message from the system" } = req.body;
    
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Create a test message
    const testMessage = {
      content,
      sender: application.employer,
      role: 'employer',
      timestamp: new Date(),
      read: false
    };
    
    // Add to application
    application.messages = application.messages || [];
    application.messages.push(testMessage);
    await application.save();
    
    res.status(201).json({ 
      message: 'Test message created', 
      data: testMessage 
    });
  } catch (error) {
    console.error('Error creating test message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


