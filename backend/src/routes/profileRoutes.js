const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
