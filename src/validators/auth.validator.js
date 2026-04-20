import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Valid email is required'),

  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['user', 'agent', 'admin']).withMessage('Invalid role'),

  body('personalAddress')
    .if(body('role').equals('agent'))
    .notEmpty().withMessage('Personal address is required for agents')
    .isLength({ max: 200 }).withMessage('Address too long')
];

export const loginValidator = [
  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Valid email is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
];