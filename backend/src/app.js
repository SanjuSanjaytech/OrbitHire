const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── Static Files ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/resume',  require('./routes/resumeRoutes'));
app.use('/api/jobs',    require('./routes/jobRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// ─── API Documentation ────────────────────────────────────────────────────────
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Job Hunter API',
    version: '1.0.0',
    description: 'AI-powered Job Hunter REST API',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'Login and get JWT token',
        'GET /auth/me': 'Get current user (protected)',
        'POST /auth/logout': 'Logout',
      },
      resume: {
        'POST /resume/upload': 'Upload PDF resume (protected)',
        'GET /resume/profile': 'Get extracted resume profile (protected)',
        'PUT /resume/skills': 'Update skills manually (protected)',
      },
      jobs: {
        'POST /jobs/search': 'Trigger LinkedIn job search (protected)',
        'GET /jobs': 'Get all matched jobs with filters (protected)',
        'GET /jobs/:id': 'Get single job detail (protected)',
        'DELETE /jobs/:id': 'Delete a job (protected)',
        'GET /jobs/stats': 'Get job match statistics (protected)',
      },
      reports: {
        'POST /reports/generate': 'Generate Excel report (protected)',
        'GET /reports': 'List all generated reports (protected)',
        'GET /reports/:id/download': 'Download a report (protected)',
        'DELETE /reports/:id': 'Delete a report (protected)',
      },
      profile: {
        'GET /profile': 'Get user profile (protected)',
        'PUT /profile': 'Update user profile (protected)',
        'PUT /profile/password': 'Change password (protected)',
      },
    },
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
