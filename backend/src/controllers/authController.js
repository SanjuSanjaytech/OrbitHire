const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail, generateOTP } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/send-otp
 * Step 1: Validate inputs, check duplicate, send OTP
 */
const sendOTP = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate all fields present
    if (!name || !email || !password || !confirmPassword) {
      return sendError(res, 'All fields are required', 400);
    }

    // Password match check
    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match', 400);
    }

    // Password length
    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'This email is already registered. Please login.', 409);
    }

    // Delete any previous OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Generate OTP
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Pre-hash the password for storage
    const passwordSalt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, passwordSalt);

    // Save OTP record
    await OTP.create({
      email: email.toLowerCase(),
      otpHash,
      name: name.trim(),
      password: hashedPassword,
    });

    // Send email
    await sendOTPEmail(email, name, otp);

    logger.info(`OTP sent to ${email}`);

    return sendSuccess(res, {
      email: email.toLowerCase(),
    }, `Verification code sent to ${email}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.`);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Step 2: Verify OTP → create user → return JWT
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 'Email and OTP are required', 400);
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return sendError(res, 'OTP expired or not found. Please register again.', 400);
    }

    // Max attempts check (prevent brute force)
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return sendError(res, 'Too many incorrect attempts. Please register again.', 429);
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
      // Increment attempts
      await OTP.updateOne(
        { email: email.toLowerCase() },
        { $inc: { attempts: 1 } }
      );
      const remaining = 4 - otpRecord.attempts;
      return sendError(res, `Incorrect OTP. ${remaining} attempt(s) remaining.`, 400);
    }

    // Double-check email not registered during OTP window
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return sendError(res, 'This email is already registered. Please login.', 409);
    }

    // Create user with pre-hashed password
    // Bypass bcrypt pre-save hook since password is already hashed
    const user = await User.create({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password,
      isActive: true,
    });

    // Clean up OTP
    await OTP.deleteOne({ email: email.toLowerCase() });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered via OTP: ${email}`);

    return sendSuccess(res, {
      token,
      user: user.toSafeObject(),
    }, 'Email verified! Account created successfully.', 201);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required', 400);

    const otpRecord = await OTP.findOne({ email: email.toLowerCase() });
    if (!otpRecord) {
      return sendError(res, 'No pending registration found. Please register again.', 400);
    }

    // Generate new OTP
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    await OTP.updateOne(
      { email: email.toLowerCase() },
      { $set: { otpHash, attempts: 0, createdAt: new Date() } }
    );

    await sendOTPEmail(email, otpRecord.name, otp);

    return sendSuccess(res, { email }, 'New verification code sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated', 403);
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    logger.info(`User logged in: ${email}`);

    return sendSuccess(res, {
      token,
      user: user.toSafeObject(),
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
  return sendSuccess(res, {}, 'Logged out successfully');
};

/**
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isActive) {
      return sendError(res, 'Cannot refresh token', 401);
    }
    const token = generateToken(user._id);
    return sendSuccess(res, { token }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendOTP, verifyOTP, resendOTP, login, getMe, logout, refreshToken };