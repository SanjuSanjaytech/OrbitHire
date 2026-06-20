const Job = require('../models/Job');
const Resume = require('../models/Resume');
const TailoredResume = require('../models/TailoredResume');
const { tailorResumeForJob } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * POST /api/resume/tailor
 * Generate and save a tailored resume for a specific job
 */
const generateTailoredResume = async (req, res, next) => {
  const { jobId } = req.body;

  try {
    if (!jobId) {
      return sendError(res, 'jobId is required', 400);
    }

    // 1. Fetch job
    const job = await Job.findOne({ _id: jobId, user: req.user._id });
    if (!job) {
      return sendError(res, 'Job not found', 404);
    }

    // 2. Check if a tailored resume already exists
    const existing = await TailoredResume.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      logger.info(`Returning existing tailored resume for job ${jobId}`);
      return sendSuccess(res, { tailoredResume: existing }, 'Existing tailored resume retrieved');
    }

    // 3. Fetch user master resume
    const masterResume = await Resume.findOne({ user: req.user._id, isActive: true });
    if (!masterResume) {
      return sendError(res, 'Please upload a master resume first', 400);
    }

    logger.info(`Generating tailored resume for job: ${job.title} at ${job.company?.name}`);

    // 4. Call Gemini to tailor the resume text
    const result = await tailorResumeForJob(masterResume, job);

    // 5. Map Gemini experience updates back to the master resume experience structure
    const tailoredExperience = (masterResume.experience || []).map((exp, idx) => {
      // Find matching index in Gemini output
      const matched = (result.tailoredExperience || []).find(e => Number(e.index) === idx);
      return {
        company: exp.company,
        role: exp.role,
        duration: exp.duration,
        description: matched ? matched.tailoredDescription : exp.description,
        technologies: exp.technologies,
      };
    });

    // 6. Create Tailored Resume
    const tailoredResume = await TailoredResume.create({
      user: req.user._id,
      job: jobId,
      title: job.title,
      company: job.company?.name || 'Company',
      profile: {
        name: masterResume.profile?.name || req.user.name,
        email: masterResume.profile?.email || req.user.email,
        phone: masterResume.profile?.phone || '',
        location: masterResume.profile?.location || '',
        summary: result.tailoredSummary || masterResume.profile?.summary || '',
        linkedIn: masterResume.profile?.linkedIn || '',
        github: masterResume.profile?.github || '',
        portfolio: masterResume.profile?.portfolio || '',
        totalExperience: masterResume.profile?.totalExperience || '',
        currentRole: masterResume.profile?.currentRole || '',
      },
      skills: {
        technical: masterResume.skills?.technical || [],
        soft: masterResume.skills?.soft || [],
        certifications: masterResume.skills?.certifications || [],
        languages: masterResume.skills?.languages || [],
      },
      experience: tailoredExperience,
      education: masterResume.education || [],
    });

    logger.info(`Successfully created tailored resume ${tailoredResume._id}`);
    return sendSuccess(res, { tailoredResume }, 'Tailored resume generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resume/tailor/:jobId
 * Retrieve the tailored resume for a specific job
 */
const getTailoredResume = async (req, res, next) => {
  const { jobId } = req.params;

  try {
    const tailoredResume = await TailoredResume.findOne({ user: req.user._id, job: jobId });
    if (!tailoredResume) {
      return sendError(res, 'Tailored resume not found for this job', 404);
    }
    return sendSuccess(res, { tailoredResume });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/resume/tailor/:id
 * Manually update a tailored resume
 */
const updateTailoredResume = async (req, res, next) => {
  const { id } = req.params;

  try {
    const updated = await TailoredResume.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
        $set: {
          'profile.summary': req.body.profile?.summary,
          'profile.phone': req.body.profile?.phone,
          'profile.location': req.body.profile?.location,
          'profile.linkedIn': req.body.profile?.linkedIn,
          'profile.github': req.body.profile?.github,
          'profile.portfolio': req.body.profile?.portfolio,
          skills: req.body.skills,
          experience: req.body.experience,
          education: req.body.education,
        },
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return sendError(res, 'Tailored resume not found or unauthorized', 404);
    }

    return sendSuccess(res, { tailoredResume: updated }, 'Tailored resume updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTailoredResume,
  getTailoredResume,
  updateTailoredResume,
};
