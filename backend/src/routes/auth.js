const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/me', authController.me);
router.get('/status', authController.status);
router.post('/logout', authController.logout);
router.post('/google', authController.googleAuth);
router.get('/google/desktop/start', authController.desktopGoogleStart);
router.get('/google/desktop/poll', authController.desktopGooglePoll);
router.get('/google/callback', authController.googleCallback);

module.exports = router;
