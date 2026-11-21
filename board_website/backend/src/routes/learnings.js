const express = require('express');
const router = express.Router();
const learningsController = require('../controllers/learningsController');
const { sanitizeBody, validateIdParam } = require('../middleware/requestValidator');
const { checkAndSendStreakReminders } = require('../services/streakReminderService');
const pushNotificationService = require('../services/pushNotificationService');
const { verifyToken, signToken } = require('../services/jwtService');
const { db } = require('../database/db');

function renderUnsubscribeHtml({ success, title, message, actionUrl, actionText }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Job Tracker</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0c0e;
      color: #f1f5f9;
      margin: 0;
      padding: 32px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      max-width: 440px;
      width: 100%;
      background: #131418;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .accent-bar {
      height: 3px;
      background: #ea580c;
    }
    .content {
      padding: 36px 28px 28px;
    }
    .icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 18px;
      background: ${success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'};
      color: ${success ? '#34d399' : '#f87171'};
      border: 1px solid ${success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 19px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    p {
      margin: 0 0 24px 0;
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 11px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn-primary {
      background: #ea580c;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
    }
    .footer {
      padding: 14px 24px;
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 11.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-bar"></div>
    <div class="content">
      <div class="icon">${success ? '✓' : '!'}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      ${actionUrl ? `<a href="${actionUrl}" class="btn btn-primary">${actionText}</a>` : ''}
      <a href="https://kanban-board-job.vercel.app/" class="btn btn-secondary">Return to Job Tracker</a>
    </div>
    <div class="footer">
      Job Tracker &bull; 100% private to your Google Drive
    </div>
  </div>
</body>
</html>`;
}

router.use(sanitizeBody);

router.get('/learnings', learningsController.getLearnings);
router.post('/learnings', learningsController.createLearning);
router.patch('/learnings/:id', validateIdParam, learningsController.updateLearning);
router.delete('/learnings/:id', validateIdParam, learningsController.deleteLearning);
router.get('/gamification', learningsController.getGamificationStats);
router.get('/learnings/gamification', learningsController.getGamificationStats);
router.all(['/learnings/streak-reminder-check', '/streak-reminder-check'], async (req, res, next) => {
  try {
    const isCronAuthorized = !process.env.CRON_SECRET ||
      req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}` ||
      req.headers['x-vercel-cron'] === '1';

    const wantsForce = req.query.force === 'true' || req.body?.force === true;
    const forceAll = wantsForce && (Boolean(req.user?.id) || isCronAuthorized);
    const targetUserId = req.user?.id || (isCronAuthorized ? req.query.userId : null);
    const slot = req.query.slot || req.body?.slot || null;
    const result = await checkAndSendStreakReminders({ forceAll, targetUserId, slot });
    res.json({ ok: 1, ...result });
  } catch (err) {
    next(err);
  }
});

// Web Push Notification Endpoints
router.get('/notifications/vapid-public-key', (req, res) => {
  const publicKey = pushNotificationService.getPublicKey();
  res.json({ publicKey });
});

router.post('/notifications/subscribe', (req, res, next) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to enable mobile notifications' });
    }
    const { subscription, userAgent } = req.body;
    const result = pushNotificationService.saveSubscription(userId, subscription, userAgent);
    res.json({ ok: 1, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/unsubscribe', (req, res, next) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Please log in' });
    }
    const { endpoint } = req.body;
    const result = pushNotificationService.deleteSubscription(userId, endpoint);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/notifications/status', (req, res) => {
  const userId = req.user?.id || req.query?.userId;
  if (!userId) {
    return res.json({ hasPush: false, deviceCount: 0 });
  }
  const subs = pushNotificationService.getUserSubscriptions(userId);
  res.json({
    hasPush: subs.length > 0,
    deviceCount: subs.length
  });
});

// ---------------------------------------------------------------------
// Streak Reminder Email Unsubscribe & Resubscribe Endpoints
// ---------------------------------------------------------------------
router.get(['/streak-reminder/unsubscribe', '/learnings/streak-reminder/unsubscribe'], (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send(renderUnsubscribeHtml({
      success: false,
      title: 'Invalid Request',
      message: 'No unsubscribe token was provided.'
    }));
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(400).send(renderUnsubscribeHtml({
      success: false,
      title: 'Link Expired or Invalid',
      message: 'This unsubscribe link is invalid or has expired.'
    }));
  }

  try {
    db.prepare('UPDATE users SET streak_reminders_enabled = 0 WHERE id = ?').run(payload.userId);

    const resubToken = signToken({ userId: payload.userId, action: 'resubscribe' }, 365 * 24 * 3600);
    const resubUrl = `/api/streak-reminder/resubscribe?token=${resubToken}`;

    return res.status(200).send(renderUnsubscribeHtml({
      success: true,
      title: 'Streak Reminders Disabled',
      message: 'You have been successfully unsubscribed. You will not receive any further daily streak reminder emails.',
      actionUrl: resubUrl,
      actionText: 'Undo & Re-enable Reminders'
    }));
  } catch (err) {
    return res.status(500).send(renderUnsubscribeHtml({
      success: false,
      title: 'Update Error',
      message: 'An error occurred while updating your preferences. Please try again.'
    }));
  }
});

// RFC 8058 One-Click POST handler (for Gmail / Apple Mail native unsubscribe button)
router.post(['/streak-reminder/unsubscribe', '/learnings/streak-reminder/unsubscribe'], (req, res) => {
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const payload = verifyToken(token);
  if (!payload || !payload.userId) return res.status(400).json({ error: 'Invalid token' });

  try {
    db.prepare('UPDATE users SET streak_reminders_enabled = 0 WHERE id = ?').run(payload.userId);
    return res.json({ ok: 1, unsubscribed: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get(['/streak-reminder/resubscribe', '/learnings/streak-reminder/resubscribe'], (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send(renderUnsubscribeHtml({
      success: false,
      title: 'Invalid Request',
      message: 'No token was provided.'
    }));
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(400).send(renderUnsubscribeHtml({
      success: false,
      title: 'Link Expired or Invalid',
      message: 'This link is invalid or has expired.'
    }));
  }

  try {
    db.prepare('UPDATE users SET streak_reminders_enabled = 1 WHERE id = ?').run(payload.userId);

    const unsubToken = signToken({ userId: payload.userId, action: 'unsubscribe' }, 365 * 24 * 3600);
    const unsubUrl = `/api/streak-reminder/unsubscribe?token=${unsubToken}`;

    return res.status(200).send(renderUnsubscribeHtml({
      success: true,
      title: 'Streak Reminders Re-enabled',
      message: 'Streak safeguard reminders are active again. We will help you protect your daily streak.',
      actionUrl: unsubUrl,
      actionText: 'Turn Off Reminders Again'
    }));
  } catch (err) {
    return res.status(500).send(renderUnsubscribeHtml({
      success: false,
      title: 'Update Error',
      message: 'An error occurred while updating your preferences. Please try again.'
    }));
  }
});

module.exports = router;
