import { body } from 'express-validator';

export const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('role').optional().isIn(['jobseeker', 'employer', 'admin']).withMessage('Invalid role'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateJobCreate = [
  body('title').notEmpty(),
  body('company').notEmpty(),
];
