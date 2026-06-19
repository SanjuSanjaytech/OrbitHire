const Job = require('../models/Job');
const Resume = require('../models/Resume');
const SavedSearch = require('../models/SavedSearch');
const { scrapeLinkedInJobs, filterRecentJobs, JOB_QUERIES } = require('../services/apifyService');
const { batchMatchJobs } = require('../services/aiService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const getSavedSearchPayload = async (userId, body = {}) => {
  if (Array.isArray(body.queries) && body.queries.length > 0) {
    return {
      queries: body.queries.map(q => String(q).trim()).filter(Boolean).slice(0, 8),
      location: body.location || 'India',
      savedSearchId: body.savedSearchId || null,
    };
  }

  if (body.savedSearchId) {
    const savedSearch = await SavedSearch.findOne({ _id: body.savedSearchId, user: userId });
    if (savedSearch) {
      return {
        queries: savedSearch.queries,
        location: savedSearch.location || 'India',
        savedSearchId: savedSearch._id,
      };
    }
  }

  const defaultSearch = await SavedSearch.findOne({ user: userId, isDefault: true });
  if (defaultSearch) {
    return {
      queries: defaultSearch.queries,
      location: defaultSearch.location || 'India',
      savedSearchId: defaultSearch._id,
    };
  }

  return { queries: JOB_QUERIES, location: 'India', savedSearchId: null };
};

const browseMatch = {
  score: 0,
  matchedSkills: [],
  missingSkills: [],
  recommendation: 'consider',
  priority: 'save_for_later',
  reasoning: 'Browse-only result. Upload a resume to unlock AI match scoring and tailored apply advice.',
  confidence: 0,
  analyzedAt: null,
  model: 'browse-only',
};

const saveJobsForUser = async ({ userId, jobs, batchId, runId, matchResults = null }) => {
  const savedJobs = [];
  let skipped = 0;
  const entries = matchResults || jobs.map(job => ({ job, match: browseMatch }));

  for (const { job, match } of entries) {
    try {
      const or = [
        ...(job.source?.jobId ? [{ 'source.jobId': job.source.jobId }] : []),
        { applyUrl: job.applyUrl },
      ];

      const saved = await Job.findOneAndUpdate(
        { user: userId, $or: or },
        {
          $setOnInsert: {
            user: userId,
            ...job,
            batchId,
            source: { ...(job.source || {}), runId },
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

  return { savedJobs, skipped };
};

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

    const { queries, location, savedSearchId } = await getSavedSearchPayload(req.user._id, req.body);

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

    const { savedJobs, skipped } = await saveJobsForUser({
      userId: req.user._id,
      jobs: recentJobs,
      batchId,
      runId,
      matchResults,
    });

    if (savedSearchId) {
      await SavedSearch.findOneAndUpdate(
        { _id: savedSearchId, user: req.user._id },
        { $set: { lastRunAt: new Date(), lastResultCount: savedJobs.length } }
      );
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
 * POST /api/jobs/browse
 * Fetch and save jobs without requiring a parsed resume.
 */
const browseJobs = async (req, res, next) => {
  try {
    const { queries, location, savedSearchId } = await getSavedSearchPayload(req.user._id, req.body);
    const { jobs: rawJobs, runId } = await scrapeLinkedInJobs(queries, location);
    const recentJobs = filterRecentJobs(rawJobs, 72);
    const batchId = `browse-${Date.now()}`;

    if (recentJobs.length === 0) {
      return sendSuccess(res, { found: 0, saved: 0, skipped: 0, batchId }, 'Browse completed');
    }

    const { savedJobs, skipped } = await saveJobsForUser({
      userId: req.user._id,
      jobs: recentJobs,
      batchId,
      runId,
    });

    if (savedSearchId) {
      await SavedSearch.findOneAndUpdate(
        { _id: savedSearchId, user: req.user._id },
        { $set: { lastRunAt: new Date(), lastResultCount: savedJobs.length } }
      );
    }

    return sendSuccess(res, {
      found: recentJobs.length,
      saved: savedJobs.length,
      skipped,
      batchId,
      apifyRunId: runId,
    }, `Browse complete. ${savedJobs.length} jobs saved.`);
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
      priority,
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
    if (priority) query['aiMatch.priority'] = priority;
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
          interview: { $sum: { $cond: [{ $eq: ['$status', 'interview'] }, 1, 0] } },
          offer: { $sum: { $cond: [{ $eq: ['$status', 'offer'] }, 1, 0] } },
          needsAction: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$aiMatch.score', 75] },
                    { $in: ['$status', ['new', 'saved']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          applyNow: { $sum: { $cond: [{ $eq: ['$aiMatch.priority', 'apply_now'] }, 1, 0] } },
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

    const topMissingSkills = await Job.aggregate([
      { $match: { user: userId, isDeleted: false, 'aiMatch.missingSkills.0': { $exists: true } } },
      { $unwind: '$aiMatch.missingSkills' },
      {
        $group: {
          _id: { $toLower: '$aiMatch.missingSkills' },
          label: { $first: '$aiMatch.missingSkills' },
          count: { $sum: 1 },
          avgScore: { $avg: '$aiMatch.score' },
        },
      },
      { $sort: { count: -1, avgScore: -1 } },
      { $limit: 8 },
      { $project: { _id: '$label', count: 1, avgScore: { $round: ['$avgScore', 0] } } },
    ]);

    const actionQueue = await Job.find({
      user: userId,
      isDeleted: false,
      status: { $in: ['new', 'saved'] },
      'aiMatch.score': { $gte: 70 },
    })
      .sort({ 'aiMatch.score': -1, postedAt: -1 })
      .limit(5)
      .select('title company location postedAt status aiMatch applyUrl')
      .lean();

    return sendSuccess(res, {
      summary: stats[0] || { total: 0, avgScore: 0, highMatch: 0, mediumMatch: 0, lowMatch: 0 },
      topCompanies,
      scoreDistribution,
      topMissingSkills,
      actionQueue,
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
    const { status, notes, followUpAt, contactName } = req.body;
    const update = { status };
    if (notes !== undefined) update.notes = notes;
    if (followUpAt !== undefined) update.followUpAt = followUpAt ? new Date(followUpAt) : null;
    if (contactName !== undefined) update.contactName = contactName;
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

module.exports = { searchJobs, browseJobs, getJobs, getStats, getJob, updateJobStatus, deleteJob };
