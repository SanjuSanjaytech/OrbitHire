# OrbitHire - AI Job Hunter

> A full-stack AI job-search platform for developers. OrbitHire lets users browse jobs from JSearchAPI on RapidAPI, save search profiles, upload a resume, get Gemini-powered match scores, track applications, export reports, and receive a daily 8:00 AM IST job digest.

![Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Jobs API](https://img.shields.io/badge/Jobs-JSearchAPI%20RapidAPI-2563EB)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-16A34A)

## Features

| Feature | Details |
| --- | --- |
| Resume parsing | Upload a PDF resume and extract profile, skills, education, and experience with Gemini |
| Browse jobs without resume | Search and save jobs before uploading a resume |
| Saved search profiles | Save role/location searches, set defaults, and control digest inclusion |
| AI job matching | Score jobs against the parsed resume with match breakdowns and action guidance |
| Application tracking | Track saved, applied, interview, offer, rejected, and follow-up states |
| Daily digest | node-cron runs saved searches every morning at 8:00 AM IST and sends Brevo email digests |
| Reports | Generate Excel reports with job details, scores, skills, and apply links |
| Account management | Separate Profile, Resume, and Settings pages with avatar upload and preferences |

## Architecture

```text
job-hunter/
  backend/                    Node.js + Express API
    src/
      controllers/            Auth, resume, jobs, reports, profile, saved searches
      middleware/             Auth, upload, validation
      models/                 User, Resume, Job, Report, SavedSearch, OTP
      routes/                 Express routers
      services/
        aiService.js          Google Gemini resume parsing and job matching
        apifyService.js       JSearchAPI/RapidAPI job fetching service
        emailService.js       Brevo OTP and job digest emails
        pdfService.js         PDF text extraction
        reportService.js      ExcelJS report generation
        schedulerService.js   Daily 8 AM IST digest runner
      utils/                  Logger, errors, API responses

  frontend/                   Next.js 14 App Router
    src/
      app/(auth)/             Login and registration
      app/(dashboard)/        Dashboard, jobs, profile, resume, settings, reports
      components/             Layout and UI components
      hooks/                  Auth guard
      lib/                    API client, store, utilities
```

Note: the job-fetching service file is still named `apifyService.js` for legacy reasons, but it now calls **JSearchAPI through RapidAPI**.

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB local or Atlas
- RapidAPI key with access to JSearchAPI
- Google Gemini API key
- Brevo API key for OTP and digest emails

### Install

```bash
npm run install:all
```

### Backend Environment

Create `backend/.env` from `backend/.env.example`:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/job-hunter

JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

RAPIDAPI_KEY=your_rapidapi_key_for_jsearchapi
GEMINI_API_KEY=your_gemini_api_key

BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=verified_sender@example.com
EMAIL_PASS=optional_smtp_password_if_used
OTP_EXPIRES_MINUTES=10

FRONTEND_URL=http://localhost:3000

MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

SCHEDULER_CRON=0 8 * * *
SCHEDULER_TIMEZONE=Asia/Kolkata
```

### Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Run Development

```bash
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- API docs: `http://localhost:5000/api/docs`

## Main API Routes

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/send-otp` | No | Start OTP registration |
| POST | `/api/auth/verify-otp` | No | Verify OTP and create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/resume/upload` | Yes | Upload and parse PDF resume |
| GET | `/api/resume/profile` | Yes | Get parsed resume |
| POST | `/api/jobs/browse` | Yes | Browse and save jobs without resume matching |
| POST | `/api/jobs/search` | Yes | Fetch jobs and run AI resume matching |
| GET | `/api/jobs` | Yes | List jobs with filters and pagination |
| PATCH | `/api/jobs/:id/status` | Yes | Update application status and notes |
| GET | `/api/jobs/stats` | Yes | Dashboard statistics |
| GET | `/api/saved-searches` | Yes | List saved search profiles |
| POST | `/api/saved-searches` | Yes | Create saved search profile |
| PUT | `/api/saved-searches/:id` | Yes | Update saved search profile |
| DELETE | `/api/saved-searches/:id` | Yes | Delete saved search profile |
| POST | `/api/reports/generate` | Yes | Generate Excel report |
| GET | `/api/reports/:id/download` | Yes | Download Excel report |
| GET | `/api/profile` | Yes | Get profile |
| PUT | `/api/profile` | Yes | Update profile/preferences |
| POST | `/api/profile/avatar` | Yes | Upload avatar |
| DELETE | `/api/profile/avatar` | Yes | Remove avatar |
| PUT | `/api/profile/password` | Yes | Change password |

## Job Search Flow

1. User creates a saved search profile with keywords and location.
2. User can browse jobs immediately through JSearchAPI/RapidAPI without a resume.
3. After resume upload, Gemini parses the resume into structured skills and experience.
4. AI matching compares each job with the parsed resume.
5. Jobs are saved with score, matched skills, missing skills, priority, recommendation, and action plan.
6. Users track applications and generate reports.

## Daily Digest

The scheduler runs at **8:00 AM IST** by default:

```env
SCHEDULER_CRON=0 8 * * *
SCHEDULER_TIMEZONE=Asia/Kolkata
```

It:

1. Finds active users with scheduler enabled.
2. Runs each user's digest-enabled saved searches through JSearchAPI/RapidAPI.
3. Saves browse-only jobs if the user has no resume.
4. Runs Gemini AI matching if the user has an active parsed resume.
5. Generates reports for scored jobs.
6. Sends a Brevo email digest when email notifications are enabled.

## AI Matching

OrbitHire uses Google Gemini to return structured match data:

```json
{
  "score": 87,
  "matchedSkills": ["Node.js", "React", "MongoDB"],
  "missingSkills": ["Docker", "AWS"],
  "recommendation": "highly_recommended",
  "priority": "apply_now",
  "reasoning": "Strong fit based on backend and React requirements.",
  "actionPlan": {
    "resumeKeywords": ["REST APIs", "React hooks"],
    "resumeSuggestions": ["Highlight production MERN projects."],
    "coverLetterAngle": "Emphasize full-stack delivery and API work.",
    "nextStep": "Apply today with a tailored resume."
  }
}
```

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Multer, pdf-parse, ExcelJS, node-cron, Winston  
**Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Query, Zustand, Recharts, react-dropzone  
**Jobs:** JSearchAPI via RapidAPI  
**AI:** Google Gemini  
**Email:** Brevo  

## Security Notes

- Passwords are hashed with bcrypt.
- Dashboard routes require JWT authentication.
- File uploads are restricted to PDF resumes and image avatars.
- API requests are rate-limited.
- Do not commit `.env`, `.next`, `node_modules`, uploads, API keys, or generated reports.

## License

MIT
