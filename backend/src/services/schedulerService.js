const cron = require('node-cron');
const logger = require('../utils/logger');

let scheduledTask = null;

/**
 * Initialize the daily 8 AM scheduler
 */
const init = () => {
  const cronExpr = process.env.SCHEDULER_CRON || '0 8 * * *';
  const timezone = process.env.SCHEDULER_TIMEZONE || 'Asia/Kolkata';

  if (scheduledTask) {
    scheduledTask.destroy();
  }

  scheduledTask = cron.schedule(cronExpr, runDailyJob, {
    timezone,
    runOnInit: false,
  });

  logger.info(`Scheduler configured: "${cronExpr}" (${timezone})`);
  return scheduledTask;
};

/**
 * The main daily job: scrape → match → report for all active users
 */
const runDailyJob = async () => {
  const startTime = Date.now();
  logger.info('═══════════════════════════════════════════');
  logger.info('🌅 Daily Job Hunter Scheduler Started');
  logger.info(`⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  logger.info('═══════════════════════════════════════════');

  try {
    const User = require('../models/User');
    const Resume = require('../models/Resume');
    const Job = require('../models/Job');
    const Report = require('../models/Report');
    const { scrapeLinkedInJobs, filterRecentJobs } = require('./apifyService');
    const { batchMatchJobs } = require('./aiService');
    const { generateJobReport } = require('./reportService');

    // Get all active users with resumes and scheduler enabled
    const users = await User.find({
      isActive: true,
      'preferences.schedulerEnabled': true,
    }).lean();

    logger.info(`Found ${users.length} active user(s) for daily processing`);

    if (users.length === 0) {
      logger.info('No active users. Scheduler done.');
      return;
    }

    // Scrape jobs once (shared across users)
    let scrapedJobs = [];
    let runId = null;

    try {
      const result = await scrapeLinkedInJobs();
      scrapedJobs = filterRecentJobs(result.jobs, 72);
      runId = result.runId;
      logger.info(`Scraped ${scrapedJobs.length} jobs from LinkedIn (last 24h)`);
    } catch (scrapeError) {
      logger.error('Scraping failed:', scrapeError);
      return;
    }

    if (scrapedJobs.length === 0) {
      logger.warn('No new jobs found in last 24 hours');
      return;
    }

    const batchId = `daily-${Date.now()}`;

    // Process each user
    for (const user of users) {
      try {
        logger.info(`Processing user: ${user.email}`);

        const resume = await Resume.findOne({ user: user._id, isActive: true });
        if (!resume) {
          logger.warn(`No resume found for user ${user.email}, skipping`);
          continue;
        }

        // Match jobs against this user's resume
        const matchResults = await batchMatchJobs(
          scrapedJobs,
          resume.skills?.technical || [],
          resume.profile?.summary
        );

        // Save matched jobs to DB
        const savedJobIds = [];
        for (const { job, match } of matchResults) {
          try {
            const savedJob = await Job.findOneAndUpdate(
              {
                user: user._id,
                $or: [
                  { 'source.jobId': job.source?.jobId },
                  { applyUrl: job.applyUrl },
                ],
              },
              {
                $setOnInsert: {
                  user: user._id,
                  ...job,
                  batchId,
                  searchQuery: job.searchQuery,
                },
                $set: { aiMatch: match },
              },
              { upsert: true, new: true }
            );
            savedJobIds.push(savedJob._id);
          } catch (jobErr) {
            if (jobErr.code !== 11000) {
              logger.error(`Failed to save job: ${jobErr.message}`);
            }
          }
        }

        logger.info(`Saved ${savedJobIds.length} jobs for ${user.email}`);

        // Generate Excel report
        if (savedJobIds.length > 0) {
          const jobsForReport = await Job.find({
            _id: { $in: savedJobIds },
            'aiMatch.score': { $gte: 35 },
          }).sort({ 'aiMatch.score': -1 });

          const reportResult = await generateJobReport(
            jobsForReport,
            { name: user.name },
            { dateFrom: '24h ago' }
          );

          await Report.create({
            user: user._id,
            fileName: reportResult.fileName,
            filePath: reportResult.filePath,
            fileSize: reportResult.fileSize,
            type: 'scheduled',
            stats: reportResult.stats,
            jobIds: savedJobIds,
          });

          logger.info(`Report generated for ${user.email}: ${reportResult.fileName}`);
        }
      } catch (userError) {
        logger.error(`Error processing user ${user.email}:`, userError);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(`✅ Daily scheduler completed in ${duration}s`);
  } catch (error) {
    logger.error('Daily scheduler failed:', error);
  }
};

/**
 * Manually trigger the daily job (for testing)
 */
const triggerManually = async () => {
  logger.info('Manual scheduler trigger invoked');
  await runDailyJob();
};

const stop = () => {
  if (scheduledTask) {
    scheduledTask.destroy();
    scheduledTask = null;
    logger.info('Scheduler stopped');
  }
};

module.exports = { init, triggerManually, stop };
