const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadResume,
  getResumeProfile,
  updateSkills,
  deleteResume,
} = require('../controllers/resumeController');

router.use(authenticate);

router.post('/upload', upload.single('resume'), handleUploadError, uploadResume);
router.get('/profile', getResumeProfile);
router.put('/skills', updateSkills);
router.delete('/', deleteResume);

module.exports = router;
