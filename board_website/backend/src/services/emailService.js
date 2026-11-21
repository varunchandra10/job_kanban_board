const nodemailer = require('nodemailer');
const config = require('../config');
const { signToken } = require('./jwtService');

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

/**
 * Send smart streak reminder email (strictly professional, zero emojis, dark theme)
 * @param {object} user - { id, email, name }
 * @param {string} reminderType - 'needs_study' | 'needs_app' | 'needs_both'
 * @param {number} streak - current active streak days
 * @param {object} stats - { todayAppCount, todayMinutes, todayStudyCount, todayDsaCount }
 * @param {string} slot - 'lunch' | 'dinner'
 */
async function sendStreakReminderEmail(user, reminderType, streak = 0, stats = {}, slot = 'dinner') {
  const mailer = getTransporter();
  const toEmail = user.email;
  const userName = user.name || 'there';
  const fromAddress = config.smtp.from || `"Job Tracker" <${config.smtp.user}>`;

  const appCount = stats.todayAppCount || 0;
  const minsCount = stats.todayMinutes || 0;
  const dsaCount = stats.todayDsaCount || 0;
  const studyCount = stats.todayStudyCount || 0;
  const hasStudyDone = studyCount >= 1 || dsaCount >= 1 || minsCount >= 45;
  const hasAppDone = appCount >= 1;

  const numStreak = Number(streak) || 0;
  const isZeroStreak = numStreak <= 0;
  const isNeedsApp = reminderType === 'needs_app';
  const isNeedsStudy = reminderType === 'needs_study';

  let subject = '';
  let badgeTag = '';
  let streakBadge = '';
  let headline = '';
  let bodyParagraph = '';
  let ctaText = 'Open Job Tracker →';

  if (isZeroStreak) {
    subject = 'Start your journey today: Build your daily streak with us';
    badgeTag = 'GET STARTED';
    streakBadge = 'Day 1 Awaits';
    headline = 'Build your daily streak today';
    bodyParagraph = `In today's toughest job market scenario, daily consistency is what truly sets you apart. Start your journey with us today—submit <strong>1 job application</strong> and log <strong>1 study topic</strong> to build your streak and stay unstoppable.`;
    ctaText = 'Start Day 1 of Your Streak →';
  } else if (isNeedsApp) {
    subject = `Your ${numStreak}-day streak is about to break: 1 job application needed`;
    badgeTag = 'STREAK SAFEGUARD';
    streakBadge = `${numStreak}-Day Streak Active`;
    headline = `Protect your ${numStreak}-day streak`;
    bodyParagraph = `You already logged your study time today. However, your streak is about to break: submit <strong>1 job application</strong> today to protect your <strong>${numStreak}-day streak</strong> and maintain your momentum.`;
    ctaText = 'Submit Job Application →';
  } else if (isNeedsStudy) {
    subject = `Your ${numStreak}-day streak is about to break: 1 study topic needed`;
    badgeTag = 'STREAK SAFEGUARD';
    streakBadge = `${numStreak}-Day Streak Active`;
    headline = `Protect your ${numStreak}-day streak`;
    bodyParagraph = `You applied to jobs today. However, your streak is about to break: log <strong>1 study topic or solve 1 DSA problem</strong> today to keep your <strong>${numStreak}-day streak</strong> active.`;
    ctaText = 'Log Study Session →';
  } else {
    subject = `Your ${numStreak}-day streak is about to break: Action needed today`;
    badgeTag = 'STREAK SAFEGUARD';
    streakBadge = `${numStreak}-Day Streak Active`;
    headline = `Protect your ${numStreak}-day streak`;
    bodyParagraph = `You have not logged progress yet today, and your <strong>${numStreak}-day streak is about to break</strong>. Complete at least <strong>1 job application</strong> and <strong>1 study session</strong> today to protect the momentum you have built.`;
    ctaText = 'Protect Your Streak →';
  }

  // Generate secure 1-click unsubscribe token valid for 1 year
  const unsubToken = signToken({ userId: user.id, action: 'unsubscribe' }, 365 * 24 * 3600);
  const baseUrl = process.env.APP_URL || (config.isVercel ? 'https://kanban-board-job.vercel.app' : 'https://kanban-board-job.vercel.app');
  const unsubUrl = `${baseUrl}/api/streak-reminder/unsubscribe?token=${unsubToken}`;
  const settingsUrl = `${baseUrl}/profile`;
  const appUrl = `${baseUrl}/`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0c0e;
      margin: 0;
      padding: 24px 16px;
      color: #f1f5f9;
    }
    .email-container {
      max-width: 480px;
      margin: 0 auto;
      background: #131418;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }
    .accent-line {
      height: 2px;
      background: #ea580c;
    }
    .content {
      padding: 26px 24px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      font-size: 10.5px;
      font-weight: 700;
      color: #ea580c;
      background: rgba(234, 88, 12, 0.1);
      border: 1px solid rgba(234, 88, 12, 0.25);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .streak-status {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
    }
    .headline {
      margin: 0 0 10px 0;
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.3px;
      line-height: 1.35;
    }
    .body-text {
      margin: 0 0 20px 0;
      font-size: 13.5px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .quest-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 22px;
    }
    .quest-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .quest-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .quest-item-border {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .badge-done {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .badge-pending {
      background: rgba(249, 115, 22, 0.12);
      color: #fb923c;
      font-size: 10.5px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .cta-btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      background: #ea580c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 11px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.1px;
    }
    .footer {
      padding: 14px 24px;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #94a3b8;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="accent-line"></div>
    <div class="content">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td align="left">
            <span class="badge">${badgeTag}</span>
          </td>
          <td align="right">
            <span class="streak-status">${streakBadge}</span>
          </td>
        </tr>
      </table>

      <h1 class="headline">${headline}</h1>
      <p class="body-text">
        Hello ${userName}, ${bodyParagraph}
      </p>

      <div class="quest-card">
        <div class="quest-title">Daily Consistency Quest (Both Required)</div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" class="quest-item-border" style="padding-bottom: 6px; margin-bottom: 6px;">
          <tr>
            <td align="left" style="font-size: 13px; color: ${hasAppDone ? '#94a3b8' : '#f1f5f9'};">
              ${hasAppDone ? '<span style="color: #10b981; font-weight: 700; margin-right: 6px;">✓</span>' : '<span style="color: #64748b; margin-right: 6px;">○</span>'} Apply to 1+ Job Role
            </td>
            <td align="right">
              ${hasAppDone ? '<span class="badge-done">Completed</span>' : '<span class="badge-pending">Pending</span>'}
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" style="font-size: 13px; color: ${hasStudyDone ? '#94a3b8' : '#f1f5f9'};">
              ${hasStudyDone ? '<span style="color: #10b981; font-weight: 700; margin-right: 6px;">✓</span>' : '<span style="color: #64748b; margin-right: 6px;">○</span>'} 1+ Study Topic or DSA Solved
            </td>
            <td align="right">
              ${hasStudyDone ? '<span class="badge-done">Completed</span>' : '<span class="badge-pending">Pending</span>'}
            </td>
          </tr>
        </table>
      </div>

      <a href="${appUrl}" class="cta-btn">
        ${ctaText}
      </a>
    </div>

    <div class="footer">
      Job Tracker &bull; 100% private to your Google Drive<br>
      <a href="${unsubUrl}">Unsubscribe from streak alerts</a> &bull; <a href="${settingsUrl}">Notification Settings</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
Job Tracker - ${isZeroStreak ? 'Start Your Journey' : 'Streak Safeguard'}

Hello ${userName},

${
  isZeroStreak
    ? "In today's toughest job market scenario, daily consistency is what truly sets you apart. Start your journey with us today—submit 1 job application and log 1 study topic to build your streak and stay unstoppable."
    : isNeedsApp
    ? `You already logged your study time today. However, your streak is about to break: submit 1 job application today to protect your ${numStreak}-day streak.`
    : isNeedsStudy
    ? `You applied to jobs today. However, your streak is about to break: log 1 study topic or solve 1 DSA problem today to keep your ${numStreak}-day streak active.`
    : `You have not logged progress yet today, and your ${numStreak}-day streak is about to break. Complete at least 1 job application and 1 study session today to protect the momentum you have built.`
}

Today's Status:
- Apply to 1+ Job Role: ${hasAppDone ? 'Completed' : 'Pending'}
- 1+ Study Topic or DSA Solved: ${hasStudyDone ? 'Completed' : 'Pending'}

Open Job Tracker: ${appUrl}

Unsubscribe from streak alerts: ${unsubUrl}
Notification Settings: ${settingsUrl}

The Job Tracker Team
  `.trim();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject,
    text: textContent,
    html: htmlContent,
    headers: {
      'List-Unsubscribe': `<${unsubUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  };

  const info = await mailer.sendMail(mailOptions);
  console.log(`[Email Service] Streak reminder email sent to ${toEmail}. MessageId: ${info.messageId}`);
  return info;
}

module.exports = {
  getTransporter,
  sendPasswordResetEmail,
  sendStreakReminderEmail
};
