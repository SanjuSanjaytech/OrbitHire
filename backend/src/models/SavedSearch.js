const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [80, 'Search name cannot exceed 80 characters'],
  },
  queries: {
    type: [String],
    required: true,
    validate: {
      validator: (queries) => Array.isArray(queries) && queries.length > 0,
      message: 'At least one search query is required',
    },
  },
  location: {
    type: String,
    trim: true,
    default: 'India',
    maxlength: [120, 'Location cannot exceed 120 characters'],
  },
  digestEnabled: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  lastRunAt: Date,
  lastResultCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

savedSearchSchema.index({ user: 1, createdAt: -1 });
savedSearchSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
