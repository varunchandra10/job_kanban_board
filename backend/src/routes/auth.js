const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/me', authController.me);
router.get('/status', authController.status);
router.post('/logout', authController.logout);
router.post('/google', authController.googleAuth);

module.exports = router;
