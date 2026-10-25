const fs = require('fs');
const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const upload = require('../middleware/upload');
const config = require('../config');
const { db } = require('../database/db');
const { storageService, isGoogleDriveLink, extractGoogleDriveFileId } = require('../services/storageService');

router.post('/delete-document', documentsController.deleteDocument);
router.delete('/delete-document', documentsController.deleteDocument);
router.post('/upload-document', upload.single('file'), documentsController.uploadDocument);
router.get('/gdrive-files', documentsController.listDriveFiles);
router.get('/file-content', documentsController.getFileContent);
router.post('/file-info', documentsController.getFileInfo);
router.get('/file-info', documentsController.getFileInfo);
router.post('/open-file', documentsController.openFile);
router.post('/reveal-file', documentsController.revealFile);

// Storage Status & Multi-User Google Drive Settings
router.get('/storage/status', (req, res) => {
  const userId = req.user?.id || 'default_user';
  let userFolderId = null;
  let userEmail = req.user?.email || null;

  try {
    const userRow = db.prepare('SELECT email, gdrive_folder_id FROM users WHERE id = ?').get(userId);
    if (userRow) {
      userFolderId = userRow.gdrive_folder_id || null;
      userEmail = userRow.email || userEmail;
    }
  } catch (_) {}

  const activeFolderId = userFolderId || null;
  const isKeyConfigured = fs.existsSync(config.googleServiceAccountKeyPath);

  res.json({
    ok: 1,
    provider: config.storageProvider,
    connected: !!activeFolderId,
    folderId: activeFolderId,
    serviceAccountReady: isKeyConfigured,
    userEmail
  });
});

router.post('/storage/connect-drive', (req, res) => {
  const userId = req.user?.id || 'default_user';
  const { folderUrl, folderId } = req.body || {};

  let targetId = folderId ? String(folderId).trim() : null;
  if (!targetId && folderUrl) {
    const match = String(folderUrl).match(/folders\/([a-zA-Z0-9_-]+)/);
    targetId = match ? match[1] : String(folderUrl).trim();
  }

  if (!targetId) {
    return res.status(400).json({ error: 'Please provide a valid Google Drive folder link or folder ID' });
  }

  try {
    db.prepare('UPDATE users SET gdrive_folder_id = ? WHERE id = ?').run(targetId, userId);
    res.json({
      ok: 1,
      folderId: targetId,
      message: 'Google Drive folder linked successfully'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save Google Drive folder: ' + err.message });
  }
});

router.get('/file-token', (req, res) => {
  const userId = req.user?.id || 'default_user';
  const { signToken } = require('../services/jwtService');
  const token = signToken({ id: userId, email: req.user?.email || '', scope: 'file_view' }, 3600);
  res.json({ ok: 1, token });
});

router.post('/storage/test-connection', async (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    let folderId = req.body.folderId || req.body.folderUrl;
    if (folderId && String(folderId).includes('folders/')) {
      const match = String(folderId).match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match) folderId = match[1];
    }
    if (folderId) folderId = String(folderId).split('?')[0].trim();

    if (!folderId) {
      const userRow = db.prepare('SELECT gdrive_folder_id FROM users WHERE id = ?').get(userId);
      folderId = userRow?.gdrive_folder_id || config.googleDriveFolderId;
    }

    if (!folderId) {
      return res.status(400).json({ ok: 0, error: 'Please provide a valid Google Drive folder link or folder ID.' });
    }

    const GoogleDriveStorageService = require('../services/googleDriveStorageService');
    const driveService = (storageService instanceof GoogleDriveStorageService)
      ? storageService
      : new GoogleDriveStorageService();

    const result = await driveService.testConnection(folderId);

    try {
      db.prepare('UPDATE users SET gdrive_folder_id = ? WHERE id = ?').run(folderId, userId);
    } catch (_) {}

    return res.json({
      ok: 1,
      message: `Google Drive is connected and verified! Access confirmed for folder: ${result.folderName}`,
      folderName: result.folderName,
      folderId: result.folderId
    });
  } catch (err) {
    console.warn('[Storage Test Connection Error]:', err.message);
    return res.status(400).json({
      ok: 0,
      error: err.message || 'Google Drive connection test failed.'
    });
  }
});

module.exports = router;
