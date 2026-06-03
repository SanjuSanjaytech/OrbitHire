const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true, // pre-hashed password stored temporarily
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // auto-delete after 10 minutes (MongoDB TTL index)
  },
});

// Index for fast lookup
otpSchema.index({ email: 1 });

// Instance method to compare OTP
otpSchema.methods.verifyOTP = async function (candidateOTP) {
  return bcrypt.compare(String(candidateOTP), this.otpHash);
};

module.exports = mongoose.model('OTP', otpSchema);