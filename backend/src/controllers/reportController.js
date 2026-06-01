const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const Report = require('../models/Report');
const Resume = require('../models/Resume');
const { generateJobReport } = require('../services/reportService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * POST /api/reports/generate
 */
const generateReport = async (req, res, next) => {
  try {
    const { minScore = 0, status, batchId, dateFrom, dateTo } = req.body;

    // Build job query
    const query = {
      user: req.user._id,
      isDeleted: false,
      'aiMatch.score': { $gte: parseInt(minScore) },
    };

    if (status) query.status = status;
    if (batchId) query.batchId = batchId;

    if (dateFrom || dateTo) {
      query.postedAt = {};
      if (dateFrom) query.postedAt.$gte = new Date(dateFrom);
      if (dateTo) query.postedAt.$lte = new Date(dateTo);
    }

    const jobs = await Job.find(query).sort({ 'aiMatch.score': -1 }).lean();

    if (jobs.length === 0) {
      return sendError(res, 'No jobs found matching the filters. Try adjusting your criteria.', 404);
    }

    const resume = await Resume.findOne({ user: req.user._id, isActive: true });
    const userProfile = { name: req.user.name, email: req.user.email };

    // Generate Excel
    const result = await generateJobReport(jobs, userProfile, {
      minScore,
      status,
      dateFrom,
      dateTo,
    });

    // Save report record
    const report = await Report.create({
      user: req.user._id,
      fileName: result.fileName,
      filePath: result.filePath,
      fileSize: result.fileSize,
      type: 'manual',
      filters: { minScore, status, dateFrom, dateTo },
      stats: result.stats,
      jobIds: jobs.map(j => j._id),
    });

    logger.info(`Report generated: ${result.fileName} for user ${req.user._id}`);

    return sendSuccess(res, {
      reportId: report._id,
      fileName: result.fileName,
      stats: result.stats,
      fileSize: result.fileSize,
    }, 'Report generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      Report.find({ user: req.user._id })
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments({ user: req.user._id }),
    ]);

    // Add download availability flag
    const enriched = reports.map(r => ({
      ...r,
      available: fs.existsSync(r.filePath),
    }));

    return sendPaginated(res, enriched, total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id/download
 */
const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return sendError(res, 'Report not found', 404);

    if (!fs.existsSync(report.filePath)) {
      return sendError(res, 'Report file has expired or been deleted', 410);
    }

    // Increment download count
    await Report.findByIdAndUpdate(report._id, { $inc: { downloadCount: 1 } });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Length', report.fileSize);

    const stream = fs.createReadStream(report.filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reports/:id
 */
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return sendError(res, 'Report not found', 404);

    // Delete file
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }

    await report.deleteOne();
    return sendSuccess(res, {}, 'Report deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport, getReports, downloadReport, deleteReport };
