import express from 'express';
import { authRequired } from '../middleware/auth.js';
import InterviewSchedule from '../models/InterviewSchedule.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';

const router = express.Router();

// All routes require auth
router.use(authRequired);

// POST /api/interviews - schedule an interview (employer only)
router.post('/', async (req, res) => {
  try {
    const { applicationId, date, time, location, type, notes, duration } = req.body;
    
    if (!applicationId || !date || !time || !location) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('jobSeeker')
      .populate('employer');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the current user is the employer
    if (application.employer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to schedule interviews for this application' });
    }

    // Create the interview
    const interview = await InterviewSchedule.create({
      application: application._id,
      jobSeeker: application.jobSeeker._id,
      employer: application.employer._id,
      job: application.job._id,
      date,
      time,
      location,
      type: type || 'video',
      notes,
      duration: duration || 60,
      status: 'scheduled'
    });

    // Update application status if it's still in 'pending' or 'reviewed'
    if (['pending', 'reviewed'].includes(application.status)) {
      application.status = 'interviewed';
      application.statusHistory.push({
        status: 'interviewed',
        changedAt: new Date(),
        changedBy: req.user.id,
        notes: `Interview scheduled for ${new Date(date).toLocaleDateString()} at ${time}`
      });
      
      // Add interview details to application
      application.interview = {
        date,
        time,
        location,
        type: type || 'video',
        notes,
        status: 'scheduled'
      };
      
      await application.save();
    }

    // Emit socket event to job seeker
    const io = req.app.get('io');
    io?.to?.(application.jobSeeker._id.toString())?.emit?.('interview:scheduled', {
      id: interview._id,
      applicationId: application._id,
      jobId: application.job._id,
      jobTitle: application.job.title,
      date,
      time,
      location,
      type: type || 'video',
      notes,
      employerName: application.employer.name,
      companyName: application.job.company
    });

    res.status(201).json({ 
      message: 'Interview scheduled successfully', 
      data: interview 
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/interviews/my - get interviews for current user
router.get('/my', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query = {};
    
    if (userRole === 'jobseeker') {
      query.jobSeeker = userId;
    } else if (userRole === 'employer') {
      query.employer = userId;
    } else if (userRole === 'admin') {
      // Admin can see all interviews
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }
    
    const interviews = await InterviewSchedule.find(query)
      .populate('application')
      .populate('jobSeeker', 'name email')
      .populate('employer', 'name email')
      .populate('job', 'title company location')
      .sort({ date: 1, time: 1 });
    
    res.json({ interviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/interviews/:id - update interview status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, jobSeekerConfirmed } = req.body;
    
    const interview = await InterviewSchedule.findById(id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    // Check permissions
    const isEmployer = interview.employer.toString() === req.user.id;
    const isJobSeeker = interview.jobSeeker.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isEmployer && !isJobSeeker && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }
    
    // Job seekers can only confirm/unconfirm
    if (isJobSeeker && status && !isAdmin) {
      return res.status(403).json({ message: 'Job seekers can only confirm or unconfirm interviews' });
    }
    
    // Update the interview
    if (status) {
      interview.status = status;
    }
    
    if (jobSeekerConfirmed !== undefined) {
      interview.jobSeekerConfirmed = jobSeekerConfirmed;
    }
    
    interview.updatedAt = new Date();
    await interview.save();
    
    // If status changed to completed or cancelled, update the application
    if (status === 'completed' || status === 'cancelled') {
      const application = await Application.findById(interview.application);
      if (application) {
        application.interview.status = status;
        await application.save();
      }
    }
    
    // Emit socket event to the other party
    const io = req.app.get('io');
    const recipientId = isEmployer ? interview.jobSeeker.toString() : interview.employer.toString();
    
    io?.to?.(recipientId)?.emit?.('interview:updated', {
      id: interview._id,
      status: interview.status,
      jobSeekerConfirmed: interview.jobSeekerConfirmed,
      updatedAt: interview.updatedAt
    });
    
    res.json({ 
      message: 'Interview updated successfully', 
      data: interview 
    });
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;