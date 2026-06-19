const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} = require('../controllers/savedSearchController');

router.use(authenticate);

const validators = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('location').optional().trim().isLength({ max: 120 }).withMessage('Location is too long'),
  body('queries').optional().custom(value => {
    const queries = Array.isArray(value) ? value : String(value || '').split(',');
    if (queries.map(q => String(q).trim()).filter(Boolean).length === 0) {
      throw new Error('At least one query is required');
    }
    return true;
  }),
];

router.get('/', listSavedSearches);
router.post('/', validators, validate, createSavedSearch);
router.put('/:id', validators, validate, updateSavedSearch);
router.delete('/:id', deleteSavedSearch);

module.exports = router;
