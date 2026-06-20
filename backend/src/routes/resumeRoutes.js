const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadResume,
  getResumeProfile,
  updateSkills,
  deleteResume,
} = require('../controllers/resumeController');
const {
  generateTailoredResume,
  getTailoredResume,
  updateTailoredResume,
} = require('../controllers/tailoredResumeController');

router.use(authenticate);

router.post('/upload', upload.single('resume'), handleUploadError, uploadResume);
router.get('/profile', getResumeProfile);
router.put('/skills', updateSkills);
router.delete('/', deleteResume);

// Tailoring endpoints
router.post('/tailor', generateTailoredResume);
router.get('/tailor/:jobId', getTailoredResume);
router.put('/tailor/:id', updateTailoredResume);

module.exports = router;
