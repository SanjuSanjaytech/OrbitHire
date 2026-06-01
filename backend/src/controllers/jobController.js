const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { scrapeLinkedInJobs, filterRecentJobs, JOB_QUERIES } = require('../services/apifyService');
const { batchMatchJobs } = require('../services/aiService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * POST /api/jobs/search
 * Trigger LinkedIn job search + AI matching
 */
const searchJobs = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id, isActive: true });
    if (!resume) {
      return sendError(res, 'Please upload your resume before searching for jobs.', 400);
    }

    const { queries = JOB_QUERIES, location = 'India' } = req.body;

    logger.info(`Job search triggered by user ${req.user._id}`);

    // 1. Scrape LinkedIn jobs via Apify
    const { jobs: rawJobs, runId } = await scrapeLinkedInJobs(queries, location);
    const recentJobs = filterRecentJobs(rawJobs, 72);

    if (recentJobs.length === 0) {
      return sendSuccess(res, {
        found: 0,
        matched: 0,
        message: 'No new jobs found in the last 24 hours',
      }, 'Search completed');
    }

    logger.info(`Found ${recentJobs.length} recent jobs, starting AI matching...`);

    // 2. AI match all jobs against resume
    const matchResults = await batchMatchJobs(
      recentJobs,
      resume.skills?.technical || [],
      resume.profile?.summary
    );

    const batchId = `manual-${Date.now()}`;
    const savedJobs = [];
    let skipped = 0;

    // 3. Save to DB (upsert by jobId or applyUrl)
    for (const { job, match } of matchResults) {
      try {
        const saved = await Job.findOneAndUpdate(
          {
            user: req.user._id,
            $or: [
              ...(job.source?.jobId ? [{ 'source.jobId': job.source.jobId }] : []),
              { applyUrl: job.applyUrl },
            ],
          },
          {
            $setOnInsert: {
              user: req.user._id,
              ...job,
              batchId,
            },
            $set: { aiMatch: match },
          },
          { upsert: true, new: true }
        );
        savedJobs.push(saved);
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          logger.error('Job save error:', err.message);
        }
      }
    }

    const avgScore = savedJobs.length > 0
      ? Math.round(savedJobs.reduce((sum, j) => sum + (j.aiMatch?.score || 0), 0) / savedJobs.length)
      : 0;

    return sendSuccess(res, {
      found: recentJobs.length,
      saved: savedJobs.length,
      skipped,
      avgMatchScore: avgScore,
      batchId,
      apifyRunId: runId,
      highMatchCount: savedJobs.filter(j => (j.aiMatch?.score || 0) >= 75).length,
    }, `Search complete. ${savedJobs.length} jobs analyzed.`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/jobs
 * List jobs with filtering, sorting, pagination
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      minScore,
      maxScore,
      recommendation,
      status,
      search,
      sortBy = 'aiMatch.score',
      sortOrder = 'desc',
      batchId,
    } = req.query;

    const query = {
      user: req.user._id,
      isDeleted: false,
    };

    if (minScore !== undefined) query['aiMatch.score'] = { $gte: parseInt(minScore) };
    if (maxScore !== undefined) {
      query['aiMatch.score'] = { ...query['aiMatch.score'], $lte: parseInt(maxScore) };
    }
    if (recommendation) query['aiMatch.recommendation'] = recommendation;
    if (status) query.status = status;
    if (batchId) query.batchId = batchId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'company.name': { $regex: search, $options: 'i' } },
        { 'location.raw': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [jobs, total] = await Promise.all([
      Job.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Job.countDocuments(query),
    ]);

    return sendPaginated(res, jobs, total, page, limit, `Found ${total} jobs`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/jobs/stats
 */
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const stats = await Job.aggregate([
      { $match: { user: userId, isDeleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgScore: { $avg: '$aiMatch.score' },
          highMatch: { $sum: { $cond: [{ $gte: ['$aiMatch.score', 75] }, 1, 0] } },
          mediumMatch: { $sum: { $cond: [{ $and: [{ $gte: ['$aiMatch.score', 55] }, { $lt: ['$aiMatch.score', 75] }] }, 1, 0] } },
          lowMatch: { $sum: { $cond: [{ $lt: ['$aiMatch.score', 55] }, 1, 0] } },
          applied: { $sum: { $cond: [{ $eq: ['$status', 'applied'] }, 1, 0] } },
          saved: { $sum: { $cond: [{ $eq: ['$status', 'saved'] }, 1, 0] } },
        },
      },
    ]);

    const topCompanies = await Job.aggregate([
      { $match: { user: userId, isDeleted: false } },
      { $group: { _id: '$company.name', count: { $sum: 1 }, avgScore: { $avg: '$aiMatch.score' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const scoreDistribution = await Job.aggregate([
      { $match: { user: userId, isDeleted: false } },
      {
        $bucket: {
          groupBy: '$aiMatch.score',
          boundaries: [0, 25, 50, 75, 101],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    return sendSuccess(res, {
      summary: stats[0] || { total: 0, avgScore: 0, highMatch: 0, mediumMatch: 0, lowMatch: 0 },
      topCompanies,
      scoreDistribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/jobs/:id
 */
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!job) return sendError(res, 'Job not found', 404);
    return sendSuccess(res, { job });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/jobs/:id/status
 */
const updateJobStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const update = { status };
    if (notes) update.notes = notes;
    if (status === 'applied') update.appliedAt = new Date();

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: update },
      { new: true }
    );

    if (!job) return sendError(res, 'Job not found', 404);
    return sendSuccess(res, { job }, 'Job status updated');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/jobs/:id
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!job) return sendError(res, 'Job not found', 404);
    return sendSuccess(res, {}, 'Job deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { searchJobs, getJobs, getStats, getJob, updateJobStatus, deleteJob };
