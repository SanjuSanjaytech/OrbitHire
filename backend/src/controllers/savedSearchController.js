const SavedSearch = require('../models/SavedSearch');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const normalizeQueries = (queries) => {
  if (Array.isArray(queries)) return queries.map(q => String(q).trim()).filter(Boolean).slice(0, 8);
  if (typeof queries === 'string') return queries.split(',').map(q => q.trim()).filter(Boolean).slice(0, 8);
  return [];
};

const listSavedSearches = async (req, res, next) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    return sendSuccess(res, { searches });
  } catch (error) {
    next(error);
  }
};

const createSavedSearch = async (req, res, next) => {
  try {
    const queries = normalizeQueries(req.body.queries);
    if (queries.length === 0) return sendError(res, 'Add at least one role, skill, or keyword.', 400);

    const count = await SavedSearch.countDocuments({ user: req.user._id });
    const isDefault = req.body.isDefault === true || count === 0;

    if (isDefault) {
      await SavedSearch.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const search = await SavedSearch.create({
      user: req.user._id,
      name: req.body.name || queries[0],
      queries,
      location: req.body.location || 'India',
      digestEnabled: req.body.digestEnabled !== false,
      isDefault,
    });

    return sendSuccess(res, { search }, 'Saved search created', 201);
  } catch (error) {
    next(error);
  }
};

const updateSavedSearch = async (req, res, next) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.location !== undefined) update.location = req.body.location;
    if (req.body.digestEnabled !== undefined) update.digestEnabled = req.body.digestEnabled;

    if (req.body.queries !== undefined) {
      const queries = normalizeQueries(req.body.queries);
      if (queries.length === 0) return sendError(res, 'Add at least one role, skill, or keyword.', 400);
      update.queries = queries;
    }

    if (req.body.isDefault === true) {
      await SavedSearch.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
      update.isDefault = true;
    }

    const search = await SavedSearch.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!search) return sendError(res, 'Saved search not found', 404);
    return sendSuccess(res, { search }, 'Saved search updated');
  } catch (error) {
    next(error);
  }
};

const deleteSavedSearch = async (req, res, next) => {
  try {
    const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!search) return sendError(res, 'Saved search not found', 404);

    if (search.isDefault) {
      const nextDefault = await SavedSearch.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return sendSuccess(res, {}, 'Saved search deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
};
