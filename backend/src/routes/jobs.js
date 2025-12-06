import express from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middleware/auth.js';
import { createJob, listJobs, getJob, getEmployerJobs, updateJob, deleteJob } from '../controllers/jobsController.js';

const router = express.Router();

// Public routes
router.get('/', listJobs);
router.get('/:id', getJob);

// Employer/Admin protected routes
router.get('/employer/my-jobs', authRequired, getEmployerJobs);
router.post(
  '/',
  authRequired,
  [
    body('title').notEmpty().withMessage('Job title is required'),
    body('description').notEmpty().withMessage('Job description is required'),
    body('company').notEmpty().withMessage('Company name is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('type').isIn(['Full-time', 'Part-time', 'Contract', 'Internship']).withMessage('Job type is invalid'),
    body('salary').isNumeric().withMessage('Salary must be a number'),
    body('postedBy').notEmpty().withMessage('Employer information is required'),
    body('requirements').isArray({ min: 1 }).withMessage('At least one requirement is needed'),
  ],
  createJob,
);
router.put(
  '/:id',
  authRequired,
  [
    body('title').optional().notEmpty().withMessage('Job title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Job description cannot be empty'),
    body('company').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('location').optional().notEmpty().withMessage('Location cannot be empty'),
    body('requirements').optional().isArray({ min: 1 }).withMessage('At least one requirement is needed'),
  ],
  updateJob,
);
router.delete('/:id', authRequired, deleteJob);

export default router;
