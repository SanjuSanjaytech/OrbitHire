const axios = require('axios');
const logger = require('../utils/logger');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, name, otp) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

  const emailData = {
    sender: {
      name: 'OrbitHire',
      email: process.env.EMAIL_USER,
    },
    to: [
      {
        email,
        name,
      },
    ],
    subject: `${otp} — Your OrbitHire verification code`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0"
                style="background:#111122;border-radius:16px;border:1px solid #1e1e42;overflow:hidden">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
                    <div style="font-size:22px;font-weight:800;color:#fff">
                      ⚡ OrbitHire
                    </div>
                    <div style="color:#c4b5fd;font-size:12px;margin-top:4px">
                      AI-Powered Job Hunter
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px">
                    <p style="color:#e2e8f0;font-size:15px;margin:0 0 6px">
                      Hi <strong>${name}</strong>,
                    </p>

                    <p style="color:#94a3b8;font-size:13px;margin:0 0 24px;line-height:1.6">
                      Your verification code for OrbitHire.
                      Expires in
                      <strong style="color:#e2e8f0">
                        ${expiresMinutes} minutes
                      </strong>.
                    </p>

                    <div style="background:#0f0f1a;border:2px solid #4f46e5;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
                      <div style="font-size:11px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px">
                        Verification Code
                      </div>

                      <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#818cf8;font-family:'Courier New',monospace">
                        ${otp}
                      </div>
                    </div>

                    <div style="background:#1e1e35;border-left:3px solid #f59e0b;border-radius:4px;padding:12px 16px;margin-bottom:20px">
                      <p style="color:#fbbf24;font-size:12px;margin:0">
                        ⚠ Never share this code. OrbitHire will never ask for it.
                      </p>
                    </div>

                    <p style="color:#475569;font-size:12px;margin:0">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #1e1e42;text-align:center">
                    <p style="color:#334155;font-size:11px;margin:0">
                      © 2026 OrbitHire
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
      }
    );

    logger.info(
      `OTP email sent to ${email}. Message ID: ${
        response.data?.messageId || 'N/A'
      }`
    );

    return true;
  } catch (error) {
    logger.error(
      'Brevo email error:',
      error.response?.data || error.message
    );

    throw new Error(
      `Failed to send verification email: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

const sendBrevoEmail = async (emailData, label = 'email') => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey,
        },
      }
    );

    logger.info(`${label} sent. Message ID: ${response.data?.messageId || 'N/A'}`);
    return true;
  } catch (error) {
    logger.error('Brevo email error:', error.response?.data || error.message);
    throw new Error(`Failed to send ${label}: ${error.response?.data?.message || error.message}`);
  }
};

const sendJobDigestEmail = async (user, jobs = [], meta = {}) => {
  if (!user?.email) throw new Error('Digest recipient email is required');
  if (!process.env.BREVO_API_KEY) {
    logger.warn(`Digest skipped for ${user.email}: BREVO_API_KEY is not configured`);
    return false;
  }

  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const topJobs = jobs.slice(0, 8);
  const rows = topJobs.map(job => {
    const score = job.aiMatch?.score || 0;
    const scoreLabel = score > 0 ? `${score}% match` : 'Browse result';
    const company = job.company?.name || 'Company';
    const location = job.location?.raw || 'Location not listed';
    const applyUrl = job.applyUrl || `${appUrl}/jobs`;

    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #e5e7eb">
          <div style="font-size:16px;font-weight:700;color:#111827">${job.title}</div>
          <div style="font-size:13px;color:#4b5563;margin-top:4px">${company} · ${location}</div>
          <div style="font-size:12px;color:#2563eb;margin-top:6px">${scoreLabel}${job.searchQuery ? ` · ${job.searchQuery}` : ''}</div>
        </td>
        <td align="right" style="padding:16px 0;border-bottom:1px solid #e5e7eb">
          <a href="${applyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700">View</a>
        </td>
      </tr>
    `;
  }).join('');

  const emailData = {
    sender: {
      name: 'OrbitHire',
      email: process.env.EMAIL_USER,
    },
    to: [{ email: user.email, name: user.name }],
    subject: `Your OrbitHire job digest: ${jobs.length} fresh role${jobs.length === 1 ? '' : 's'}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,'Segoe UI',sans-serif;color:#111827">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
                <tr>
                  <td style="padding:28px 32px;background:#2563eb;color:#ffffff">
                    <div style="font-size:22px;font-weight:800">OrbitHire</div>
                    <div style="font-size:13px;margin-top:6px;opacity:.9">Daily job digest · ${meta.date || new Date().toLocaleDateString('en-IN')}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px">
                    <p style="font-size:15px;margin:0 0 8px">Hi <strong>${user.name || 'there'}</strong>,</p>
                    <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0 0 22px">
                      We found ${jobs.length} fresh job${jobs.length === 1 ? '' : 's'} from your saved searches${meta.searchCount ? ` across ${meta.searchCount} profile${meta.searchCount === 1 ? '' : 's'}` : ''}.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${rows || '<tr><td style="padding:18px 0;color:#4b5563">No fresh jobs matched today. Your saved searches will run again tomorrow.</td></tr>'}
                    </table>
                    <div style="margin-top:24px">
                      <a href="${appUrl}/jobs" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:9px;padding:12px 18px;font-size:13px;font-weight:700">Open job dashboard</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">
                    You can edit saved searches or disable digest emails from OrbitHire profile settings.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  return sendBrevoEmail(emailData, `Job digest email to ${user.email}`);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendJobDigestEmail,
};
