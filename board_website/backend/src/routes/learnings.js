const express = require('express');
const router = express.Router();
const learningsController = require('../controllers/learningsController');
const { sanitizeBody, validateIdParam } = require('../middleware/requestValidator');
const { checkAndSendStreakReminders } = require('../services/streakReminderService');

router.use(sanitizeBody);

router.get('/learnings', learningsController.getLearnings);
router.post('/learnings', learningsController.createLearning);
router.patch('/learnings/:id', validateIdParam, learningsController.updateLearning);
router.delete('/learnings/:id', validateIdParam, learningsController.deleteLearning);
router.get('/gamification', learningsController.getGamificationStats);
router.get('/learnings/gamification', learningsController.getGamificationStats);
router.post('/learnings/streak-reminder-check', async (req, res, next) => {
  try {
    const forceAll = req.query.force === 'true' || req.body?.force === true;
    const targetUserId = req.user?.id || null;
    const result = await checkAndSendStreakReminders({ forceAll, targetUserId });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
