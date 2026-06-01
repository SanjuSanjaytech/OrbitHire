const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Raw data from Apify LinkedIn scraper
  source: {
    platform: { type: String, default: 'LinkedIn' },
    jobId: String,
    scrapedAt: { type: Date, default: Date.now },
    runId: String,  // Apify run ID
  },
  // Job details
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    name: { type: String, required: true },
    logoUrl: String,
    industry: String,
    size: String,
    linkedInUrl: String,
  },
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
    raw: String,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [String],
  responsibilities: [String],
  requiredSkills: [String],
  niceToHaveSkills: [String],
  
  // Job metadata
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'unknown'],
    default: 'unknown',
  },
  seniorityLevel: String,
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' },
    period: { type: String, enum: ['monthly', 'annual', 'unknown'], default: 'unknown' },
    raw: String,
  },
  applyUrl: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    required: true,
  },

  // AI Match Analysis
  aiMatch: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    matchedSkills: [String],
    missingSkills: [String],
    recommendation: {
      type: String,
      enum: ['highly_recommended', 'recommended', 'consider', 'not_recommended'],
      default: 'consider',
    },
    reasoning: String,
    analyzedAt: Date,
    model: String,
  },

  // User actions
  status: {
    type: String,
    enum: ['new', 'saved', 'applied', 'rejected', 'interview', 'offer', 'ignored'],
    default: 'new',
  },
  notes: String,
  appliedAt: Date,

  // Search metadata
  searchQuery: String,
  batchId: String,

  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Indexes for fast queries
jobSchema.index({ user: 1, 'aiMatch.score': -1 });
jobSchema.index({ user: 1, postedAt: -1 });
jobSchema.index({ user: 1, status: 1 });
jobSchema.index({ user: 1, 'source.jobId': 1 }, { unique: true, sparse: true });
jobSchema.index({ batchId: 1 });
jobSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Job', jobSchema);
