import express from 'express';
import { authRequired } from '../middleware/auth.js';
import Feedback from '../models/Feedback.js';
import Application from '../models/Application.js';

const router = express.Router();

// All routes require auth
router.use(authRequired);

// POST /api/feedback - send feedback
router.post('/', async (req, res) => {
  try {
    const { applicationId, content, rating, type } = req.body;
    
    if (!applicationId || !content) {
      return res.status(400).json({ message: 'applicationId and content are required' });
    }

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('jobSeeker')
      .populate('employer');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Determine sender and recipient based on user role
    const senderId = req.user.id;
    const isEmployer = application.employer._id.toString() === senderId;
    const isJobSeeker = application.jobSeeker._id.toString() === senderId;
    
    if (!isEmployer && !isJobSeeker) {
      return res.status(403).json({ message: 'Not authorized to send feedback for this application' });
    }

    // Determine recipient
    const recipientId = isEmployer ? application.jobSeeker._id : application.employer._id;

    // Create the feedback
    const feedback = await Feedback.create({
      application: application._id,
      sender: senderId,
      recipient: recipientId,
      job: application.job._id,
      content,
      rating: rating || null,
      type: type || 'general',
      read: false
    });

    // Emit socket event to recipient
    const io = req.app.get('io');
    io?.to?.(recipientId.toString())?.emit?.('feedback:new', {
      id: feedback._id,
      applicationId: application._id,
      jobId: application.job._id,
      jobTitle: application.job.title,
      content: feedback.content,
      rating: feedback.rating,
      type: feedback.type,
      senderName: isEmployer ? application.employer.name : application.jobSeeker.name,
      senderRole: isEmployer ? 'employer' : 'jobseeker',
      createdAt: feedback.createdAt
    });

    res.status(201).json({ 
      message: 'Feedback sent successfully', 
      data: feedback 
    });
  } catch (error) {
    console.error('Send feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/feedback/my - get feedback for current user
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const feedback = await Feedback.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .populate('job', 'title company')
      .populate('application')
      .sort({ createdAt: -1 });
    
    res.json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/feedback/:id/read - mark feedback as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Only the recipient can mark as read
    if (feedback.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this feedback as read' });
    }
    
    feedback.read = true;
    await feedback.save();
    
    res.json({ 
      message: 'Feedback marked as read', 
      data: feedback 
    });
  } catch (error) {
    console.error('Mark feedback read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;