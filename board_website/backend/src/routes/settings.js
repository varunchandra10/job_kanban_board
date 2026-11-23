const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Scoped heavy JSON body parser dedicated to resume version PDF base64 payloads
const heavyJsonParser = express.json({ limit: '50mb' });

router.patch('/profile', settingsController.updateProfile);
router.post('/versions', heavyJsonParser, settingsController.createVersion);
router.patch('/versions/:id', heavyJsonParser, settingsController.updateVersion);
router.delete('/versions/:id', settingsController.deleteVersion);
router.get('/versions/:id/pdf', settingsController.getVersionPdf);
router.put('/settings/:key', settingsController.updateSetting);

module.exports = router;
