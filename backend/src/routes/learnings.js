const express = require('express');
const router = express.Router();
const learningsController = require('../controllers/learningsController');
const { sanitizeBody, validateIdParam } = require('../middleware/requestValidator');

router.use(sanitizeBody);

router.get('/learnings', learningsController.getLearnings);
router.post('/learnings', learningsController.createLearning);
router.patch('/learnings/:id', validateIdParam, learningsController.updateLearning);
router.delete('/learnings/:id', validateIdParam, learningsController.deleteLearning);
router.get('/gamification', learningsController.getGamificationStats);
router.get('/learnings/gamification', learningsController.getGamificationStats);

module.exports = router;
