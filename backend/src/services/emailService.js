const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

  const mailOptions = {
    from: `"OrbitHire" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OrbitHire Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background-color:#16162a;border-radius:16px;border:1px solid #1e1e35;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      ⚡ OrbitHire
                    </div>
                    <div style="color:#c4b5fd;font-size:14px;margin-top:6px;">
                      AI-Powered Job Hunter
                    </div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px 0;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 28px 0;line-height:1.6;">
                      Use the verification code below to complete your registration.
                      This code expires in <strong style="color:#e2e8f0;">${expiresMinutes} minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color:#0f0f1a;border:2px solid #4f46e5;border-radius:12px;
                                padding:28px;text-align:center;margin:0 0 28px 0;">
                      <div style="color:#94a3b8;font-size:12px;letter-spacing:3px;
                                  text-transform:uppercase;margin-bottom:12px;">
                        Your verification code
                      </div>
                      <div style="font-size:42px;font-weight:800;letter-spacing:12px;
                                  color:#818cf8;font-family:'Courier New',monospace;">
                        ${otp}
                      </div>
                    </div>

                    <!-- Warning -->
                    <div style="background-color:#1e1e35;border-left:3px solid #f59e0b;
                                border-radius:4px;padding:14px 16px;margin-bottom:24px;">
                      <p style="color:#fbbf24;font-size:13px;margin:0;line-height:1.5;">
                        ⚠️ Never share this code with anyone.
                        OrbitHire will never ask for your OTP.
                      </p>
                    </div>

                    <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">
                      If you didn't request this, you can safely ignore this email.
                      Someone may have entered your email by mistake.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #1e1e35;text-align:center;">
                    <p style="color:#475569;font-size:12px;margin:0;">
                      © 2024 OrbitHire · AI-Powered Job Matching
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
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error('Failed to send verification email. Please check your email address.');
  }
};

module.exports = { generateOTP, sendOTPEmail };