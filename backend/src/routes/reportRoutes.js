const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generateReport, getReports, downloadReport, deleteReport } = require('../controllers/reportController');

router.use(authenticate);

router.post('/generate', generateReport);
router.get('/', getReports);
router.get('/:id/download', downloadReport);
router.delete('/:id', deleteReport);

module.exports = router;
