const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const upload = require('../middleware/upload');
const config = require('../config');
const { isGoogleDriveLink, extractGoogleDriveFileId } = require('../services/storageService');

router.post('/upload-document', upload.single('file'), documentsController.uploadDocument);
router.get('/file-content', documentsController.getFileContent);
router.post('/file-info', documentsController.getFileInfo);
router.get('/file-info', documentsController.getFileInfo);
router.post('/open-file', documentsController.openFile);
router.post('/reveal-file', documentsController.revealFile);

// Phase 3 Cloud Storage Status & Google Drive Link Helper
router.get('/storage/status', (req, res) => {
  res.json({
    provider: config.storageProvider,
    googleDriveConfigured: !!(config.googleDriveFolderId && fs.existsSync(config.googleServiceAccountKeyPath)),
    folderId: config.googleDriveFolderId || null
  });
});

module.exports = router;
