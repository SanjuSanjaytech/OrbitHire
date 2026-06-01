const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * GET /api/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, preferences } = req.body;
    const update = {};

    if (name) update.name = name;
    if (preferences) update.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    );

    return sendSuccess(res, { user: user.toSafeObject() }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, {}, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
