const router = require('express').Router();
const { body } = require('express-validator');
const {
  sendOTP, verifyOTP, resendOTP,
  login, getMe, logout, refreshToken,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Send OTP (step 1 of registration)
router.post('/send-otp',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  validate,
  sendOTP
);

// Verify OTP (step 2 — creates account)
router.post('/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  verifyOTP
);

// Resend OTP
router.post('/resend-otp',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validate,
  resendOTP
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// Protected
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/refresh', authenticate, refreshToken);

module.exports = router;