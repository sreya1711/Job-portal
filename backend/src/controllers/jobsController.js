import { validationResult } from 'express-validator';
import Job from '../models/Job.js';
import { emitAnalyticsUpdate } from '../utils/helpers.js';

export async function listJobs(req, res) {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.json({ jobs }); // Wrap the jobs array in an object with a jobs property
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getJob(req, res) {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
}

export async function createJob(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!['employer', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { title, description, company, location, salary, requirements, type } = req.body;
  const job = await Job.create({
    title,
    description,
    company,
    location,
    salary,
    requirements,
    type,
    employer: req.user.id, // Assuming req.user.id contains the employer's ID
  });

  // Emit real-time event
  const io = req.app.get('io');
  io?.emit('job:new', { id: job._id, title: job.title, company: job.company, location: job.location });
  
  await emitAnalyticsUpdate(io);

  res.status(201).json(job);
}

export async function updateJob(req, res) {
  if (!['employer', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.params;
  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'User not authorized to update this job' });
  }

  const updatedJob = await Job.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updatedJob);
}

export async function deleteJob(req, res) {
  if (!['employer', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { id } = req.params;
  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'User not authorized to delete this job' });
  }

  await Job.findByIdAndDelete(id);
  res.json({ message: 'Job removed' });
}

export async function getEmployerJobs(req, res) {
  if (!['employer', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 });
  res.json(jobs);
}
