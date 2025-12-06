import express from 'express';
import { body } from 'express-validator';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMe,
  updateMe,
} from '../controllers/employeeController.js';

const router = express.Router();

// Admin can list all employees; employer can list for management use (optional future filter by manager)
router.get('/', authRequired, requireRole('admin', 'employer'), listEmployees);

// Current employee profile
router.get('/me', authRequired, requireRole('employee'), getMe);
router.patch('/me', authRequired, requireRole('employee'), updateMe);

// Create employee profile (admin or employer)
router.post(
  '/',
  authRequired,
  requireRole('admin', 'employer'),
  [body('user').notEmpty().withMessage('user is required')],
  createEmployee
);

// CRUD by id (admin or employer)
router.get('/:id', authRequired, requireRole('admin', 'employer'), getEmployee);
router.put(
  '/:id',
  authRequired,
  requireRole('admin', 'employer'),
  updateEmployee
);
router.delete('/:id', authRequired, requireRole('admin'), deleteEmployee);

export default router;
