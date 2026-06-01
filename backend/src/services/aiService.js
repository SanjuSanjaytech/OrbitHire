const logger = require('../utils/logger');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash';

/**
 * Call Google Gemini API
 */
const callGemini = async (systemPrompt, userPrompt, maxTokens = 2000) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const response = await fetch(
    `${GEMINI_API_URL}/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Empty response from Gemini API');

  return {
    content,
    usage: data.usageMetadata,
    model: MODEL,
  };
};

/**
 * Best-effort JSON repair for truncated responses.
 * Closes any unclosed arrays/objects so JSON.parse can succeed.
 */
const repairAndParse = (raw) => {
  let str = raw.replace(/,\s*$/, '');

  const stack = [];
  let inString = false;
  let escape = false;

  for (const ch of str) {
    if (escape)        { escape = false; continue; }
    if (ch === '\\')   { escape = true;  continue; }
    if (ch === '"')    { inString = !inString; continue; }
    if (inString)      continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' || ch === ']') stack.pop();
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    str += stack[i] === '{' ? '}' : ']';
  }

  return JSON.parse(str);
};

/**
 * Safely parse JSON from Gemini — handles markdown fences,
 * extra whitespace, and truncated output.
 */
const safeParseJSON = (raw) => {
  // Strip markdown fences
  let str = raw.trim();
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // Attempt 1: direct parse
  try {
    return JSON.parse(str);
  } catch (_) {}

  // Attempt 2: extract outermost { } block
  const start = str.indexOf('{');
  const end   = str.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(str.slice(start, end + 1));
    } catch (_) {}
  }

  // Attempt 3: repair truncated JSON
  if (start !== -1) {
    return repairAndParse(str.slice(start));
  }

  throw new Error('Could not parse JSON from Gemini response');
};

/**
 * Extract structured profile data from resume text
 */
const extractResumeProfile = async (resumeText) => {
  const systemPrompt = `You are an expert resume parser. Extract structured information from the resume text.
Always respond with valid JSON only. No markdown, no explanation, just the JSON object.`;

  const userPrompt = `Parse this resume and extract all information. Return a JSON object with this exact structure:
{
  "profile": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "summary": "string",
    "linkedIn": "string or null",
    "github": "string or null",
    "portfolio": "string or null",
    "totalExperience": "e.g., '3 years 6 months'",
    "currentRole": "string"
  },
  "skills": {
    "technical": [
      {
        "name": "React",
        "category": "framework",
        "proficiency": "advanced"
      }
    ],
    "soft": ["Leadership", "Communication"],
    "certifications": ["AWS Certified", "etc"],
    "languages": ["English", "Hindi"]
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "Jan 2022 - Present",
      "current": true,
      "description": "string",
      "technologies": ["Node.js", "React"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "B.Tech",
      "field": "Computer Science",
      "year": "2021",
      "gpa": "string or null"
    }
  ]
}

Skill categories must be one of: language, framework, database, cloud, tool, other
Proficiency must be one of: beginner, intermediate, advanced, expert

RESUME TEXT:
${resumeText.substring(0, 6000)}`;

  try {
    const result = await callGemini(systemPrompt, userPrompt, 4096);
    const parsed = safeParseJSON(result.content);
    return {
      ...parsed,
      meta: {
        model: result.model,
        tokensUsed: result.usage?.candidatesTokenCount,
        confidence: 0.9,
      },
    };
  } catch (error) {
    logger.error('Resume extraction error:', error);
    throw new Error(`Failed to extract resume data: ${error.message}`);
  }
};

/**
 * Match a job posting against resume skills
 */
const matchJobToResume = async (job, resumeSkills, resumeSummary) => {
  const systemPrompt = `You are an expert technical recruiter and AI job matcher.
Analyze how well a candidate's profile matches a job posting.
Always respond with valid JSON only. No markdown, no explanation.`;

  const candidateSkills = resumeSkills.map(s => s.name).join(', ');

  const userPrompt = `Analyze this job match and return a JSON object:

CANDIDATE PROFILE:
Skills: ${candidateSkills}
Summary: ${resumeSummary || 'Not provided'}

JOB POSTING:
Title: ${job.title}
Company: ${job.company?.name}
Location: ${job.location?.raw || job.location?.city}
Description: ${(job.description || '').substring(0, 2000)}

Return this JSON structure:
{
  "score": 85,
  "matchedSkills": ["Node.js", "React", "MongoDB"],
  "missingSkills": ["Docker", "Kubernetes"],
  "recommendation": "highly_recommended",
  "reasoning": "Strong match for backend and full-stack roles. 85% skill alignment. Missing only DevOps skills."
}

Rules:
- score: 0-100 integer
- recommendation must be: "highly_recommended" (score>=75), "recommended" (score 55-74), "consider" (score 35-54), "not_recommended" (score<35)
- matchedSkills: skills from candidate that match job requirements
- missingSkills: important job requirements not in candidate profile
- reasoning: 2-3 sentence explanation`;

  try {
    const result = await callGemini(systemPrompt, userPrompt, 1024);
    const parsed = safeParseJSON(result.content);
    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      recommendation: ['highly_recommended', 'recommended', 'consider', 'not_recommended']
        .includes(parsed.recommendation) ? parsed.recommendation : 'consider',
      reasoning: parsed.reasoning || 'Analysis completed',
      analyzedAt: new Date(),
      model: result.model,
    };
  } catch (error) {
    logger.error('Job matching error:', error);
    return fallbackMatch(job, resumeSkills);
  }
};

/**
 * Fallback keyword-based matching when AI is unavailable
 */
const fallbackMatch = (job, resumeSkills) => {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const skills = resumeSkills.map(s => s.name.toLowerCase());

  const matchedSkills = skills.filter(skill => jobText.includes(skill));
  const score = Math.min(100, Math.round((matchedSkills.length / Math.max(skills.length, 1)) * 100 * 1.5));

  let recommendation = 'not_recommended';
  if (score >= 75) recommendation = 'highly_recommended';
  else if (score >= 55) recommendation = 'recommended';
  else if (score >= 35) recommendation = 'consider';

  return {
    score,
    matchedSkills,
    missingSkills: [],
    recommendation,
    reasoning: 'Keyword-based analysis (AI unavailable)',
    analyzedAt: new Date(),
    model: 'fallback-keyword',
  };
};

/**
 * Batch match multiple jobs against resume
 */
const batchMatchJobs = async (jobs, resumeSkills, resumeSummary, batchSize = 5) => {
  const results = [];

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(job => matchJobToResume(job, resumeSkills, resumeSummary))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({ job: batch[index], match: result.value });
      } else {
        logger.error(`Match failed for job ${batch[index]._id}:`, result.reason);
        results.push({ job: batch[index], match: fallbackMatch(batch[index], resumeSkills) });
      }
    });

    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

module.exports = {
  extractResumeProfile,
  matchJobToResume,
  batchMatchJobs,
  fallbackMatch,
};