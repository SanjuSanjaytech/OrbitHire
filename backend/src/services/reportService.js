const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

/**
 * Generate Excel report from matched jobs
 */
const generateJobReport = async (jobs, userProfile, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  
  // Workbook metadata
  workbook.creator = 'Job Hunter AI';
  workbook.lastModifiedBy = userProfile?.name || 'System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ── Sheet 1: Job Matches ────────────────────────────────────────────────────
  const jobSheet = workbook.addWorksheet('Job Matches', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Define columns
  jobSheet.columns = [
    { header: '#', key: 'index', width: 5 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Role / Title', key: 'role', width: 35 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Posted', key: 'posted', width: 18 },
    { header: 'Match Score', key: 'score', width: 14 },
    { header: 'Recommendation', key: 'recommendation', width: 20 },
    { header: 'Matched Skills', key: 'matchedSkills', width: 40 },
    { header: 'Missing Skills', key: 'missingSkills', width: 30 },
    { header: 'AI Reasoning', key: 'reasoning', width: 50 },
    { header: 'Apply URL', key: 'applyUrl', width: 50 },
  ];

  // Style header row
  const headerRow = jobSheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a1a2e' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF4f46e5' } },
    };
  });
  headerRow.height = 32;

  // Score color function
  const getScoreColor = (score) => {
    if (score >= 75) return 'FF16a34a'; // green
    if (score >= 55) return 'FFca8a04'; // amber
    if (score >= 35) return 'FFea580c'; // orange
    return 'FFdc2626'; // red
  };

  const getRecommendationText = (rec) => {
    const map = {
      highly_recommended: '⭐ Highly Recommended',
      recommended: '✅ Recommended',
      consider: '🤔 Consider',
      not_recommended: '❌ Not Recommended',
    };
    return map[rec] || rec;
  };

  // Add data rows
  jobs.forEach((job, idx) => {
    const score = job.aiMatch?.score || 0;
    const row = jobSheet.addRow({
      index: idx + 1,
      company: job.company?.name || '',
      role: job.title || '',
      location: job.location?.raw || `${job.location?.city || ''}, ${job.location?.state || ''}`.trim().replace(/^,|,$/g, ''),
      type: job.employmentType || '',
      posted: job.postedAt ? new Date(job.postedAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }) : '',
      score: `${score}%`,
      recommendation: getRecommendationText(job.aiMatch?.recommendation),
      matchedSkills: (job.aiMatch?.matchedSkills || []).join(', '),
      missingSkills: (job.aiMatch?.missingSkills || []).join(', '),
      reasoning: job.aiMatch?.reasoning || '',
      applyUrl: job.applyUrl || '',
    });

    // Row styling
    row.height = 20;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: false };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFe5e7eb' } },
      };
    });

    // Alternate row background
    if (idx % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      });
    }

    // Score cell color
    const scoreCell = row.getCell('score');
    scoreCell.font = { bold: true, color: { argb: getScoreColor(score) } };
    scoreCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Apply URL as hyperlink
    if (job.applyUrl) {
      const urlCell = row.getCell('applyUrl');
      urlCell.value = { text: 'Apply Now', hyperlink: job.applyUrl };
      urlCell.font = { color: { argb: 'FF4f46e5' }, underline: true };
    }
  });

  // Add autofilter
  jobSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: jobSheet.columns.length },
  };

  // ── Sheet 2: Summary ────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary & Stats');
  
  const totalJobs = jobs.length;
  const highMatch = jobs.filter(j => (j.aiMatch?.score || 0) >= 75).length;
  const mediumMatch = jobs.filter(j => (j.aiMatch?.score || 0) >= 55 && (j.aiMatch?.score || 0) < 75).length;
  const lowMatch = jobs.filter(j => (j.aiMatch?.score || 0) < 55).length;
  const avgScore = totalJobs > 0
    ? Math.round(jobs.reduce((sum, j) => sum + (j.aiMatch?.score || 0), 0) / totalJobs)
    : 0;

  const summaryData = [
    ['Job Hunter AI - Daily Report'],
    [''],
    ['Generated:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ['Candidate:', userProfile?.name || 'N/A'],
    [''],
    ['── STATISTICS ──────────────────'],
    ['Total Jobs Found:', totalJobs],
    ['High Match (≥75%):', highMatch],
    ['Medium Match (55-74%):', mediumMatch],
    ['Low Match (<55%):', lowMatch],
    ['Average Match Score:', `${avgScore}%`],
    [''],
    ['── FILTERS APPLIED ─────────────'],
    ['Min Score:', filters.minScore ? `${filters.minScore}%` : 'None'],
    ['Date Range:', filters.dateFrom ? `${filters.dateFrom} to ${filters.dateTo || 'Now'}` : 'Last 24 hours'],
    [''],
    ['── TOP COMPANIES ───────────────'],
  ];

  // Top companies
  const companyCounts = {};
  jobs.forEach(j => {
    const name = j.company?.name || 'Unknown';
    companyCounts[name] = (companyCounts[name] || 0) + 1;
  });
  Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([company, count]) => summaryData.push([company, `${count} role(s)`]));

  summaryData.forEach(rowData => {
    const row = summarySheet.addRow(rowData);
    if (rowData[0] && rowData[0].toString().startsWith('─')) {
      row.font = { bold: true, color: { argb: 'FF4f46e5' } };
    }
    if (rowData[0] === 'Job Hunter AI - Daily Report') {
      row.font = { bold: true, size: 16, color: { argb: 'FF1a1a2e' } };
    }
  });

  summarySheet.getColumn(1).width = 35;
  summarySheet.getColumn(2).width = 25;

  // ── Save file ───────────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `job-report-${timestamp}.xlsx`;
  const filePath = path.join(reportsDir, fileName);

  await workbook.xlsx.writeFile(filePath);
  const fileSize = fs.statSync(filePath).size;

  logger.info(`Excel report generated: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)`);

  return {
    fileName,
    filePath,
    fileSize,
    stats: { totalJobs, highMatch, mediumMatch, lowMatch, avgScore },
  };
};

module.exports = { generateJobReport };
