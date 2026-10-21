const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/export', backupController.exportZip);
router.post('/snapshot', backupController.backupDatabase);

module.exports = router;
