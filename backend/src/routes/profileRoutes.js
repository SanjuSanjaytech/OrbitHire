const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
} = require('../controllers/profileController');
const { validate } = require('../middleware/validate');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');

router.use(authenticate);

router.get('/', getProfile);
router.put('/',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone cannot exceed 20 characters'),
    body('location').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Location cannot exceed 120 characters'),
    body('headline').optional({ checkFalsy: true }).trim().isLength({ max: 140 }).withMessage('Headline cannot exceed 140 characters'),
    body('bio').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
  ],
  validate,
  updateProfile
);
router.post('/avatar', uploadAvatar.single('avatar'), handleUploadError, uploadProfilePicture);
router.delete('/avatar', removeProfilePicture);
router.put('/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
