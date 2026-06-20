const mongoose = require('mongoose');

const tailoredResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
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
  experience: [{
    company: String,
    role: String,
    duration: String,
    description: String,
    technologies: [String],
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    year: String,
    gpa: String,
  }],
  version: { type: Number, default: 1 },
}, {
  timestamps: true,
});

// Compound index to ensure a user only has one tailored resume per job
tailoredResumeSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('TailoredResume', tailoredResumeSchema);
