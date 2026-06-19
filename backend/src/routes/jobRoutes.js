const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  searchJobs,
  browseJobs,
  getJobs,
  getStats,
  getJob,
  updateJobStatus,
  deleteJob,
} = require('../controllers/jobController');

router.use(authenticate);

router.post('/search', searchJobs);
router.post('/browse', browseJobs);
router.get('/stats', getStats);
router.get('/', getJobs);
router.get('/:id', getJob);
router.patch('/:id/status', updateJobStatus);
router.delete('/:id', deleteJob);

module.exports = router;
