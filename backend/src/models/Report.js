const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: Number,
  
  // Report metadata
  type: {
    type: String,
    enum: ['manual', 'scheduled', 'daily'],
    default: 'manual',
  },
  filters: {
    minScore: Number,
    searchQuery: String,
    dateFrom: Date,
    dateTo: Date,
    status: String,
  },
  stats: {
    totalJobs: Number,
    highMatch: Number,    // score >= 70
    mediumMatch: Number,  // score 40-69
    lowMatch: Number,     // score < 40
    avgScore: Number,
  },
  jobIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
}, {
  timestamps: true,
});

reportSchema.index({ user: 1, generatedAt: -1 });
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Report', reportSchema);
