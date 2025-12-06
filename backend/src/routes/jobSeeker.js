import express from 'express';
import { search } from '../controllers/jobSeekerController.js';
import { authRequired } from '../middleware/auth.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

// Job seeker search proxy
router.get('/jobs', search);

// POST /api/jobseeker/apply - Apply to a job
router.post('/apply', authRequired, async (req, res) => {
  try {
    const { jobId, coverLetter, resume } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      jobSeekerId: user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    // Find employer
    const employer = await User.findOne({ company: job.company });
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    // Create application
    const application = await Application.create({
      jobId,
      jobSeekerId: user._id,
      employerId: employer._id,
      coverLetter,
      resume,
    });

    // Update job applicant count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

    // Emit real-time event
    const io = req.app.get('io');
    io?.emit('application:new', {
      jobId,
      jobTitle: job.title,
      company: job.company,
      applicantName: user.name
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
