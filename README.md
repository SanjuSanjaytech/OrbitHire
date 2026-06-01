# 🎯 Job Hunter AI

> An AI-powered full-stack job hunting dashboard for developers — scrapes LinkedIn via Apify, matches jobs against your resume using Claude AI, and exports results to Excel. Runs automatically every day at 8 AM IST.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)  ![Platform](https://img.shields.io/badge/Jobs-LinkedIn-0A66C2)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 📄 **Resume Parser** | Upload PDF → AI extracts skills, experience, education |
| 🔍 **Job Scraper** | Apify LinkedIn scraper — 4 search queries, India, last 24h |
| 🤖 **AI Matching** | Claude Sonnet scores each job 0–100, lists matched/missing skills |
| 📊 **Excel Export** | ExcelJS report with all columns + summary sheet |
| ⏰ **Scheduler** | node-cron runs daily at 8 AM IST automatically |
| 🔐 **Auth** | JWT authentication, protected routes |
| 📱 **Responsive** | Dark-themed Next.js dashboard, mobile-friendly |

---

## 🏗 Architecture

```
job-hunter/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── config/             # Database connection
│       ├── controllers/        # Request handlers
│       │   ├── authController.js
│       │   ├── resumeController.js
│       │   ├── jobController.js
│       │   ├── reportController.js
│       │   └── profileController.js
│       ├── middleware/         # Auth, upload, validation
│       ├── models/             # Mongoose schemas
│       │   ├── User.js
│       │   ├── Resume.js
│       │   ├── Job.js
│       │   └── Report.js
│       ├── routes/             # Express routers
│       ├── services/           # Business logic
│       │   ├── aiService.js        # Anthropic Claude API
│       │   ├── apifyService.js     # LinkedIn scraper
│       │   ├── pdfService.js       # PDF text extraction
│       │   ├── reportService.js    # ExcelJS generation
│       │   └── schedulerService.js # node-cron daily job
│       └── utils/              # Logger, errors, responses
│
└── frontend/                   # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── (auth)/         # Login, Register
        │   └── (dashboard)/    # Protected pages
        │       ├── dashboard/  # Stats + charts
        │       ├── jobs/       # Job list + detail panel
        │       ├── profile/    # Resume upload + skills
        │       └── reports/    # Excel generation
        ├── components/         # Reusable UI components
        ├── hooks/              # useAuthGuard
        └── lib/                # API client, store, utils
```

---

## 🗄 Database Schema

### User
```js
{ name, email, password(hashed), role, isActive, lastLogin, preferences }
```

### Resume
```js
{
  user, originalFileName, rawText,
  profile: { name, email, phone, location, summary, currentRole, totalExperience },
  skills: { technical[{name, category, proficiency}], soft[], certifications[], languages[] },
  experience[{ company, role, duration, technologies[] }],
  education[{ institution, degree, field, year }],
  extractionMeta: { model, confidence, tokensUsed }
}
```

### Job
```js
{
  user, title,
  company: { name, logoUrl, industry },
  location: { city, state, country, remote, hybrid, raw },
  description, applyUrl, postedAt, employmentType,
  aiMatch: { score(0-100), matchedSkills[], missingSkills[], recommendation, reasoning },
  status, batchId
}
```

### Report
```js
{ user, fileName, filePath, fileSize, type, filters, stats, jobIds[], downloadCount }
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- [Apify](https://apify.com) account + API token
- [Anthropic](https://console.anthropic.com) API key

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/job-hunter-ai
cd job-hunter-ai
npm run install:all
```

### 2. Configure Environment
```bash
npm run setup   # copies .env.example files
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/job-hunter
JWT_SECRET=your_min_32_char_secret_here
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run Development
```bash
npm run dev
# Backend:  http://localhost:5000
# Frontend: http://localhost:3000
# API Docs: http://localhost:5000/api/docs
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login, get JWT |
| GET  | `/api/auth/me` | ✓ | Get current user |
| POST | `/api/resume/upload` | ✓ | Upload PDF resume |
| GET  | `/api/resume/profile` | ✓ | Get extracted profile |
| PUT  | `/api/resume/skills` | ✓ | Update skills |
| POST | `/api/jobs/search` | ✓ | Trigger LinkedIn scrape + AI match |
| GET  | `/api/jobs` | ✓ | List jobs (filter, sort, paginate) |
| GET  | `/api/jobs/stats` | ✓ | Dashboard statistics |
| PATCH| `/api/jobs/:id/status` | ✓ | Update job status |
| POST | `/api/reports/generate` | ✓ | Generate Excel report |
| GET  | `/api/reports/:id/download` | ✓ | Download Excel file |

---

## 🤖 AI Matching Logic

For each job, Claude Sonnet is prompted with:
- **Candidate skills** (extracted from resume)
- **Job description** (from LinkedIn)

Returns:
```json
{
  "score": 87,
  "matchedSkills": ["Node.js", "Express", "MongoDB", "React"],
  "missingSkills": ["Docker", "AWS"],
  "recommendation": "highly_recommended",
  "reasoning": "Strong match — 87% skill overlap..."
}
```

Recommendation thresholds:
- `highly_recommended` — score ≥ 75
- `recommended` — score 55–74
- `consider` — score 35–54
- `not_recommended` — score < 35

---

## ⏰ Scheduler

The daily cron runs at **8:00 AM IST** (`0 8 * * *` Asia/Kolkata):

1. Fetches all active users with resumes + scheduler enabled
2. Runs Apify LinkedIn scraper (4 queries, India, last 24h)
3. AI-matches all jobs against each user's resume
4. Saves results to MongoDB (upserts to avoid duplicates)
5. Generates Excel report and saves to DB

To trigger manually:
```js
const scheduler = require('./src/services/schedulerService');
await scheduler.triggerManually();
```

---

## 📊 Excel Report Columns

| Column | Description |
|--------|-------------|
| # | Row number |
| Company | Company name |
| Role / Title | Job title |
| Location | City, State |
| Type | full-time / contract |
| Posted | Formatted date |
| Match Score | Color-coded % |
| Recommendation | ⭐ Highly / ✅ / 🤔 / ❌ |
| Matched Skills | From your resume |
| Missing Skills | Gaps to fill |
| AI Reasoning | 2-sentence explanation |
| Apply URL | Clickable hyperlink |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens expire in **7 days**
- **Helmet.js** security headers
- **Rate limiting** — 100 req / 15 min per IP
- File uploads restricted to **PDF only**, max 10MB
- All dashboard routes require valid JWT

---

## 🛠 Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Multer, pdf-parse, ExcelJS, node-cron, Winston  
**Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand, Recharts, react-dropzone  
**AI:** Anthropic Claude Sonnet 4  
**Scraping:** Apify LinkedIn Jobs Scraper  

---

## 📝 License

MIT © 2024 Job Hunter AI
