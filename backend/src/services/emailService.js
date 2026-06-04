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
      email: 'noreply@orbithire.com',
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

module.exports = {
  generateOTP,
  sendOTPEmail,
};