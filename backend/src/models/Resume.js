const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  // Extracted profile data
  profile: {
    name: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    linkedIn: String,
    github: String,
    portfolio: String,
    totalExperience: String,
    currentRole: String,
  },
  // Skills categorized
  skills: {
    technical: [{
      name: { type: String, required: true },
      category: {
        type: String,
        enum: ['language', 'framework', 'database', 'cloud', 'tool', 'other'],
        default: 'other',
      },
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate',
      },
    }],
    soft: [String],
    certifications: [String],
    languages: [String],
  },
  // Work experience
  experience: [{
    company: String,
    role: String,
    duration: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
    technologies: [String],
  }],
  // Education
  education: [{
    institution: String,
    degree: String,
    field: String,
    year: String,
    gpa: String,
  }],
  // AI extraction metadata
  extractionMeta: {
    extractedAt: { type: Date, default: Date.now },
    model: String,
    confidence: { type: Number, min: 0, max: 1 },
    tokensUsed: Number,
  },
  // Version tracking
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Virtual: all skill names as flat array
resumeSchema.virtual('allSkillNames').get(function () {
  return this.skills.technical.map(s => s.name.toLowerCase());
});

// Index
resumeSchema.index({ user: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
