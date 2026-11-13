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

/**
 * Send smart evening streak reminder email
 * @param {object} user - { email, name }
 * @param {string} reminderType - 'needs_study' | 'needs_app' | 'needs_both'
 * @param {number} streak - current active streak days
 * @param {object} stats - { todayAppCount, todayMinutes, todayStudyCount, todayDsaCount }
 * @param {string} slot - 'lunch' | 'dinner'
 */
async function sendStreakReminderEmail(user, reminderType, streak, stats = {}, slot = 'dinner') {
  const mailer = getTransporter();
  const toEmail = user.email;
  const userName = user.name || 'Champion';
  const fromAddress = config.smtp.from || `"Job Tracker" <${config.smtp.user}>`;

  const isLunch = slot === 'lunch';
  const isNeedsApp = reminderType === 'needs_app';
  const isNeedsStudy = reminderType === 'needs_study';

  const subject = isLunch
    ? isNeedsApp
      ? `🍱 Midday Streak Check: 1 job application needed before lunch!`
      : isNeedsStudy
      ? `🍱 Midday Streak Check: 1 study topic or DSA problem needed before lunch!`
      : `🍱 Midday Streak Check: Protect your ${streak}-day streak before lunch!`
    : isNeedsApp
    ? `🔥 Protect your ${streak}-day streak! 1 job application needed`
    : isNeedsStudy
    ? `🔥 Protect your ${streak}-day streak! 1 study topic or DSA problem needed`
    : `🔥 Action needed tonight! 1 job application + 1 study topic needed for your streak`;

  const headerTitle = isLunch
    ? isNeedsApp
      ? '1 Job Application Needed Today'
      : isNeedsStudy
      ? 'Study Session / DSA Needed Today'
      : 'Midday Streak Check-in'
    : isNeedsApp
    ? '1 Job Application Needed Tonight'
    : isNeedsStudy
    ? 'Study Session / DSA Needed Tonight'
    : 'Job Application & Study Topic Needed Tonight';

  const headerSubtitle = isLunch
    ? isNeedsApp
      ? 'You logged study time today—knock out 1 quick job application before lunch!'
      : isNeedsStudy
      ? 'You applied to jobs today—squeeze in 1 quick study topic or DSA problem!'
      : 'Midday reminder to log your daily goals and keep your streak safe!'
    : isNeedsApp
    ? 'You studied today, but need 1 job application to maintain your streak!'
    : isNeedsStudy
    ? 'You applied to jobs today, but need 1 study topic to maintain your streak!'
    : 'Neither goal logged yet today—keep your daily momentum burning strong!';

  const appCount = stats.todayAppCount || 0;
  const minsCount = stats.todayMinutes || 0;
  const dsaCount = stats.todayDsaCount || 0;
  const studyCount = stats.todayStudyCount || 0;
  const hasStudyDone = studyCount >= 1 || dsaCount >= 1 || minsCount >= 45;

  const bodyParagraph = isLunch
    ? isNeedsApp
      ? `You got an early start on your study session today (${studyCount > 0 ? `${studyCount} topic(s)` : ''}${dsaCount > 0 ? ` + ${dsaCount} DSA solved` : ''}${minsCount > 0 ? ` (${minsCount}m)` : ''})! To secure your <strong>${streak}-day streak</strong>, take 5 minutes to submit at least <strong>1 job application</strong> before lunch.`
      : isNeedsStudy
      ? `You applied to <strong>${appCount} ${appCount === 1 ? 'role' : 'roles'}</strong> today—great job! To keep your <strong>${streak}-day streak</strong> active, plan to log at least <strong>1 study topic</strong> or solve <strong>1 DSA problem</strong>.`
      : `Midday check-in! You haven't logged any job applications or study topics yet today. Remember: for a proper streak, both goals are required—at least <strong>1 job application</strong> AND at least <strong>1 study topic (or 1 DSA problem)</strong>.`
    : isNeedsApp
    ? `You conquered your study session today (${studyCount > 0 ? `${studyCount} topic(s)` : ''}${dsaCount > 0 ? ` + ${dsaCount} DSA solved` : ''}${minsCount > 0 ? ` (${minsCount}m)` : ''})! To secure your <strong>${streak}-day streak</strong>, you just need to submit at least <strong>1 job application</strong> before midnight.`
    : isNeedsStudy
    ? `You applied to <strong>${appCount} ${appCount === 1 ? 'role' : 'roles'}</strong> today—solid work! To keep your <strong>${streak}-day streak</strong> active, you also need to log at least <strong>1 study topic</strong> or solve <strong>1 DSA problem</strong> before midnight.`
    : `You haven't logged any job applications or study topics yet today. Remember: for a proper streak, both goals are required—at least <strong>1 job application</strong> AND at least <strong>1 study topic (or 1 DSA problem)</strong> before midnight!`;

  const ctaText = isNeedsApp
    ? 'Submit 1 Job Application →'
    : isNeedsStudy
    ? 'Log 1 Study Topic / Solve DSA →'
    : 'Open Job Tracker & Protect Streak →';

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
      padding: 24px;
      color: #f1f5f9;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #141519;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
    }
    .header {
      background: linear-gradient(135deg, #ea580c, #f97316, #e11d48);
      padding: 36px 28px;
      text-align: center;
      color: #ffffff;
    }
    .streak-pill {
      display: inline-block;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .content h2 {
      margin-top: 0;
      font-size: 18px;
      color: #ffffff;
      font-weight: 800;
    }
    .status-card {
      background: #1b1c22;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 18px;
      margin: 22px 0;
    }
    .status-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 13.5px;
    }
    .status-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .badge-done {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 11px;
    }
    .badge-pending {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      border: 1px solid rgba(249, 115, 22, 0.3);
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 11px;
    }
    .cta-btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 800;
      margin: 24px 0 10px 0;
      box-shadow: 0 8px 20px -4px rgba(249, 115, 22, 0.4);
    }
    .footer {
      padding: 20px 28px;
      background-color: #101114;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="streak-pill">${isLunch ? `🍱 ${streak}-DAY STREAK &bull; MIDDAY CHECK-IN` : `🔥 ${streak}-DAY STREAK ON THE LINE`}</div>
      <h1>${headerTitle}</h1>
      <p>${headerSubtitle}</p>
    </div>
    <div class="content">
      <h2>Hey ${userName},</h2>
      <p>
        ${bodyParagraph}
      </p>

      <div class="status-card">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">
          Today's Streak Quest (Both Required)
        </div>

        <div class="status-item">
          <span style="color: #e2e8f0;">1. Apply to 1+ Job Role</span>
          ${
            appCount >= 1
              ? `<span class="badge-done">✓ Done (${appCount})</span>`
              : `<span class="badge-pending">⏳ Pending (0)</span>`
          }
        </div>

        <div class="status-item">
          <span style="color: #e2e8f0;">2. 1+ Study Topic OR 1+ DSA Solved</span>
          ${
            hasStudyDone
              ? `<span class="badge-done">✓ Done</span>`
              : `<span class="badge-pending">⏳ Pending</span>`
          }
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">
        ${isLunch ? 'You have the afternoon and evening ahead. Knock out a quick task before or during lunch to stay ahead!' : 'You have ample evening time before midnight. Hop on for a quick session to protect your streak and earn extra XP!'}
      </p>

      <a href="https://kanban-board-job.vercel.app/" class="cta-btn">
        ${ctaText}
      </a>
    </div>

    <div class="footer">
      Sent by Job Tracker &bull; ${isLunch ? 'Midday Streak Check-in &bull; Local Time: Lunchtime' : 'Streak Safeguard Reminder &bull; Local Time: Evening'}
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Job Tracker - ${isLunch ? 'Midday Streak Check-in' : 'Streak Safeguard Reminder'}

Hey ${userName},

${isLunch ? `Keep your ${streak}-day streak going before lunch!` : `Your ${streak}-day streak is on the line!`}

${
  isNeedsApp
    ? isLunch
      ? `You got an early start on study today! Don't forget to submit at least 1 job application today before lunch or this evening.`
      : `You studied today, but still need to submit at least 1 job application before midnight.`
    : isNeedsStudy
    ? isLunch
      ? `You applied to ${appCount} role(s) today! Make time for 1 study topic or DSA problem before lunch or this evening.`
      : `You applied to ${appCount} role(s) today, but still need at least 1 study topic OR 1 solved DSA problem before midnight.`
    : isLunch
    ? `Midday check-in: You haven't logged any job applications or study topics yet today. Both are required to keep your streak burning!`
    : `You haven't logged any job applications or study topics yet today. Both are required before midnight to maintain your streak!`
}

Today's Status:
- 1+ Job Application: ${appCount >= 1 ? 'Done' : 'Pending'}
- 1+ Study Topic / DSA: ${hasStudyDone ? 'Done' : 'Pending'}

Open Job Tracker: https://kanban-board-job.vercel.app/

The Job Tracker Team
  `.trim();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject,
    text: textContent,
    html: htmlContent
  };

  const info = await mailer.sendMail(mailOptions);
  console.log(`[Email Service] Streak reminder email (${reminderType}) sent to ${toEmail}. MessageId: ${info.messageId}`);
  return info;
}

module.exports = {
  getTransporter,
  sendPasswordResetEmail,
  sendStreakReminderEmail
};
