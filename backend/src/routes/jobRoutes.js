const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  searchJobs,
  getJobs,
  getStats,
  getJob,
  updateJobStatus,
  deleteJob,
} = require('../controllers/jobController');

router.use(authenticate);

router.post('/search', searchJobs);
router.get('/stats', getStats);
router.get('/', getJobs);
router.get('/:id', getJob);
router.patch('/:id/status', updateJobStatus);
router.delete('/:id', deleteJob);

module.exports = router;
