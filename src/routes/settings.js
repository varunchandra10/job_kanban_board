const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.patch('/profile', settingsController.updateProfile);
router.post('/versions', settingsController.createVersion);
router.patch('/versions/:id', settingsController.updateVersion);
router.delete('/versions/:id', settingsController.deleteVersion);
router.get('/versions/:id/pdf', settingsController.getVersionPdf);
router.put('/settings/:key', settingsController.updateSetting);

module.exports = router;
