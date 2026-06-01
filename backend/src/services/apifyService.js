const logger = require('../utils/logger');

const JOB_QUERIES = [
  'Node.js developer fresher',
  'MERN stack developer fresher',
  'Full stack developer fresher',
  'Junior backend developer Node.js',
  'Junior web developer React Node.js',
  'Entry level software developer JavaScript',
  'Trainee software developer',
  'Junior software engineer',
];

/**
 * Fetch jobs from JSearch API (RapidAPI)
 */
const fetchJobsFromJSearch = async (query, location = 'India') => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error('RAPIDAPI_KEY is not configured in .env');

  // Use 3days instead of today — much more results for fresher roles
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query + ' ' + location)}&page=1&num_pages=2&date_posted=3days`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`JSearch API error: ${err.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Main function — loops all queries, deduplicates, normalizes
 */
const scrapeLinkedInJobs = async (queries = JOB_QUERIES, location = 'India') => {
  logger.info(`Fetching jobs for ${queries.length} queries via JSearch...`);

  const allRawJobs = [];
  const seen = new Set();

  for (const query of queries) {
    try {
      const raw = await fetchJobsFromJSearch(query, location);
      logger.info(`Query "${query}": ${raw.length} results`);

      for (const job of raw) {
        const id = job.job_id || generateJobId(job);
        if (!seen.has(id)) {
          seen.add(id);
          allRawJobs.push(job);
        }
      }

      // Small pause between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      logger.error(`Query "${query}" failed: ${err.message}`);
    }
  }

  const jobs = normalizeJSearchJobs(allRawJobs);
  logger.info(`Total unique jobs after dedup: ${jobs.length}`);

  return { jobs, runId: `jsearch-${Date.now()}` };
};

/**
 * Normalize JSearch response to our Job schema
 */
const normalizeJSearchJobs = (rawJobs = []) => {
  return rawJobs
    .filter(job => job && job.job_title && job.employer_name)
    .map(job => ({
      title: job.job_title || '',
      company: {
        name: job.employer_name || '',
        logoUrl: job.employer_logo || null,
        industry: null,
        size: null,
        linkedInUrl: null,
      },
      location: {
        raw: [job.job_city, job.job_state, job.job_country]
          .filter(Boolean)
          .join(', '),
        city:    job.job_city    || '',
        state:   job.job_state   || '',
        country: job.job_country || 'India',
        remote:  job.job_is_remote || false,
        hybrid:  false,
      },
      description: job.job_description || '',
      applyUrl:    job.job_apply_link  || job.job_google_link || '',
      postedAt:    job.job_posted_at_datetime_utc
        ? new Date(job.job_posted_at_datetime_utc)
        : new Date(),
      employmentType: normalizeEmploymentType(job.job_employment_type || ''),
      seniorityLevel: job.job_required_experience?.required_experience_in_months
        ? `${Math.round(job.job_required_experience.required_experience_in_months / 12)}+ years`
        : null,
      salary: {
        min:      job.job_min_salary    || null,
        max:      job.job_max_salary    || null,
        currency: job.job_salary_currency || 'INR',
        period:   job.job_salary_period  || 'unknown',
        raw:      null,
      },
      source: {
        platform: 'JSearch',
        jobId:    job.job_id || generateJobId(job),
      },
      searchQuery: null,
    }));
};

/**
 * Filter jobs posted within last N hours
 */
const filterRecentJobs = (jobs, hoursAgo = 24) => {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursAgo);
  return jobs.filter(job => new Date(job.postedAt) >= cutoff);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeEmploymentType = (type) => {
  const t = type.toLowerCase();
  if (t.includes('full'))      return 'full-time';
  if (t.includes('part'))      return 'part-time';
  if (t.includes('contract'))  return 'contract';
  if (t.includes('freelance')) return 'freelance';
  if (t.includes('intern'))    return 'internship';
  return 'unknown';
};

const generateJobId = (job) => {
  const str = `${job.job_title}-${job.employer_name}-${job.job_city}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `gen-${Math.abs(hash)}`;
};

module.exports = {
  scrapeLinkedInJobs,
  normalizeJSearchJobs,
  filterRecentJobs,
  JOB_QUERIES,
};