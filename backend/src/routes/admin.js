import express from 'express';
import { authRequired } from '../middleware/auth.js';
import statsRoutes from './admin/stats.js';

const router = express.Router();

// Middleware to check admin role
const adminRequired = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// All routes require authentication
router.use(authRequired);

// Health check endpoint (no admin check)
router.get('/health', (_req, res) => res.json({ ok: true }));

// Admin-only routes
router.use(adminRequired);

// Stats routes
router.use('/stats', statsRoutes);

export default router;
