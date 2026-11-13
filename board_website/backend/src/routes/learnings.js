const express = require('express');
const router = express.Router();
const learningsController = require('../controllers/learningsController');
const { sanitizeBody, validateIdParam } = require('../middleware/requestValidator');
const { checkAndSendStreakReminders } = require('../services/streakReminderService');
const pushNotificationService = require('../services/pushNotificationService');

router.use(sanitizeBody);

router.get('/learnings', learningsController.getLearnings);
router.post('/learnings', learningsController.createLearning);
router.patch('/learnings/:id', validateIdParam, learningsController.updateLearning);
router.delete('/learnings/:id', validateIdParam, learningsController.deleteLearning);
router.get('/gamification', learningsController.getGamificationStats);
router.get('/learnings/gamification', learningsController.getGamificationStats);
router.all(['/learnings/streak-reminder-check', '/streak-reminder-check'], async (req, res, next) => {
  try {
    const forceAll = req.query.force === 'true' || req.body?.force === true;
    const targetUserId = req.user?.id || req.query.userId || null;
    const slot = req.query.slot || req.body?.slot || null;
    const result = await checkAndSendStreakReminders({ forceAll, targetUserId, slot });
    res.json(result);
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

module.exports = router;
