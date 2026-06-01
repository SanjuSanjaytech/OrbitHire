const Resume = require('../models/Resume');
const { extractTextFromPDF, deleteFile } = require('../services/pdfService');
const { extractResumeProfile } = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * POST /api/resume/upload
 * Upload PDF, extract text, parse with AI, save profile
 */
const uploadResume = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    logger.info(`Processing resume upload for user: ${req.user._id}`);

    // 1. Extract text from PDF
    const { text, pages } = await extractTextFromPDF(filePath);
    
    if (text.length < 100) {
      deleteFile(filePath);
      return sendError(res, 'Could not extract sufficient text from PDF. Please ensure it is not scanned/image-based.', 422);
    }

    // 2. Use AI to parse the resume
    const extracted = await extractResumeProfile(text);

    // 3. Upsert resume (one per user)
    const existingResume = await Resume.findOne({ user: req.user._id });
    const version = existingResume ? existingResume.version + 1 : 1;

    // Delete old file if exists
    if (existingResume?.filePath) {
      deleteFile(existingResume.filePath);
    }

    const resume = await Resume.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        originalFileName: req.file.originalname,
        filePath: filePath,
        rawText: text,
        profile: extracted.profile || {},
        skills: extracted.skills || { technical: [], soft: [], certifications: [], languages: [] },
        experience: extracted.experience || [],
        education: extracted.education || [],
        extractionMeta: {
          extractedAt: new Date(),
          model: extracted.meta?.model,
          confidence: extracted.meta?.confidence,
          tokensUsed: extracted.meta?.tokensUsed,
        },
        version,
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(`Resume processed: ${resume._id}, ${pages} pages, ${resume.skills?.technical?.length} skills extracted`);

    return sendSuccess(res, {
      resume: {
        id: resume._id,
        version: resume.version,
        pages,
        profile: resume.profile,
        skills: resume.skills,
        experience: resume.experience,
        education: resume.education,
        extractionMeta: resume.extractionMeta,
      },
    }, 'Resume uploaded and processed successfully', 201);
  } catch (error) {
    if (filePath) deleteFile(filePath);
    next(error);
  }
};

/**
 * GET /api/resume/profile
 */
const getResumeProfile = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id, isActive: true });
    if (!resume) {
      return sendError(res, 'No resume found. Please upload your resume first.', 404);
    }
    return sendSuccess(res, { resume });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/resume/skills
 * Manually update skills
 */
const updateSkills = async (req, res, next) => {
  try {
    const { technical, soft, certifications } = req.body;

    const resume = await Resume.findOne({ user: req.user._id, isActive: true });
    if (!resume) {
      return sendError(res, 'No resume found', 404);
    }

    if (technical) resume.skills.technical = technical;
    if (soft) resume.skills.soft = soft;
    if (certifications) resume.skills.certifications = certifications;

    await resume.save();

    return sendSuccess(res, { skills: resume.skills }, 'Skills updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/resume
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id });
    if (!resume) return sendError(res, 'No resume found', 404);

    deleteFile(resume.filePath);
    await resume.deleteOne();

    return sendSuccess(res, {}, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getResumeProfile, updateSkills, deleteResume };
