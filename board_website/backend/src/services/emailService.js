const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const cleanPass = (config.smtp.pass || '').replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: cleanPass
      }
    });
  }
  return transporter;
}

/**
 * Send 6-digit verification code email for password reset
 */
async function sendPasswordResetEmail(toEmail, code) {
  const mailer = getTransporter();

  const fromAddress = config.smtp.from || `"Job Tracker" <${config.smtp.user}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Job Tracker Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.6;
    }
    .content h2 {
      margin-top: 0;
      font-size: 19px;
      color: #0f172a;
      font-weight: 700;
    }
    .content p {
      margin: 0 0 18px;
      color: #475569;
      font-size: 14px;
    }
    .code-box {
      margin: 24px 0;
      padding: 20px;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 14px;
      text-align: center;
    }
    .code-digits {
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #1d4ed8;
      display: inline-block;
      margin: 0;
    }
    .code-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-top: 8px;
    }
    .note {
      font-size: 13px;
      color: #64748b;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      padding: 20px 28px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Job Tracker</h1>
      <p>Your Private Career &amp; Learning Hub</p>
    </div>
    <div class="content">
      <h2>Password Reset Verification</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Job Tracker account (<strong>${toEmail}</strong>). Enter the verification code below to set a new password:</p>
      
      <div class="code-box">
        <div class="code-digits">${code}</div>
        <div class="code-label">Verification Code (Valid for 15 minutes)</div>
      </div>

      <div class="note">
        <strong>Security Tip:</strong> Never share this code with anyone. If you did not request this password reset, no action is required and your account remains safe.
      </div>

      <p style="margin-bottom: 0;">Best regards,<br><strong>The Job Tracker Team</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Job Tracker &bull; 100% User-Owned Google Drive &amp; Local Storage
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Job Tracker - Password Reset Verification

We received a request to reset your password for: ${toEmail}

Your 6-Digit Verification Code: ${code}

This code is valid for 15 minutes.
If you did not request this change, you can safely ignore this email.

The Job Tracker Team
  `.trim();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Your Job Tracker Verification Code: ${code}`,
    text: textContent,
    html: htmlContent
  };

  const info = await mailer.sendMail(mailOptions);
  console.log(`[Email Service] Password reset email sent to ${toEmail}. MessageId: ${info.messageId}`);
  return info;
}

module.exports = {
  getTransporter,
  sendPasswordResetEmail
};
