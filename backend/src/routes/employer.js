import express from 'express';
import { authRequired } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import User from '../models/User.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authRequired);

// GET /api/employer/jobs - Get employer's posted jobs
router.get('/jobs', async (req, res) => {
  try {
    // For now, we'll filter by company name, but ideally we'd have employerId in Job model
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await Job.find({ company: user.company || user.name })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/employer/jobs - Create a new job
router.post('/jobs', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobData = {
      ...req.body,
      company: user.company || user.name,
      companyLogo: user.avatar || req.body.companyLogo,
    };

    const job = await Job.create(jobData);

    // Emit real-time event
    const io = req.app.get('io');
    io?.emit('job:new', {
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/employer/jobs/:id - Delete a job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job belongs to this employer
    if (job.company !== (user.company || user.name)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employer/applications - Get applications for employer's jobs
router.get('/applications', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get employer's jobs first
    const jobs = await Job.find({ company: user.company || user.name });
    const jobIds = jobs.map(job => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title company')
      .populate('jobSeekerId', 'name email avatar')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/employer/applications/:id/status - Update application status
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify employer owns this application
    if (application.employerId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/employer/profile - Get employer profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      name: user.company || user.name,
      description: user.profile?.bio || '',
      location: '', // Could be added to user model
      website: '',
      logo: user.avatar,
      email: user.email,
      phone: '',
      linkedin: ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/employer/profile - Update employer profile
router.put('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update user fields
    user.company = req.body.name;
    user.avatar = req.body.logo;
    if (req.body.description) {
      user.profile = user.profile || {};
      user.profile.bio = req.body.description;
    }

    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

