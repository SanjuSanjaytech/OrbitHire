const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

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
    const { name, phone, location, headline, bio, preferences } = req.body;
    const update = {};

    if (name !== undefined) update.name = String(name).trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    if (location !== undefined) update.location = String(location).trim();
    if (headline !== undefined) update.headline = String(headline).trim();
    if (bio !== undefined) update.bio = String(bio).trim();
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
 * POST /api/profile/avatar
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'Please upload an image file.', 400);

    const user = await User.findById(req.user._id);
    deleteLocalAvatar(user.avatarUrl);

    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return sendSuccess(res, { user: user.toSafeObject() }, 'Profile picture updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/profile/avatar
 */
const removeProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    deleteLocalAvatar(user.avatarUrl);

    user.avatarUrl = undefined;
    await user.save();

    return sendSuccess(res, { user: user.toSafeObject() }, 'Profile picture removed');
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

const deleteLocalAvatar = (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return;
  const filePath = path.join(__dirname, '..', '..', avatarUrl);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
};
