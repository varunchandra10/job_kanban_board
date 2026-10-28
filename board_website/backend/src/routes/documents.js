const fs = require('fs');
const path = require('path');
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
router.get('/document-content', documentsController.getFileContent);
router.post('/file-info', documentsController.getFileInfo);
router.get('/file-info', documentsController.getFileInfo);
router.post('/open-file', documentsController.openFile);
router.post('/reveal-file', documentsController.revealFile);

// Local Storage Info & Folder Management
router.get('/storage/local-info', (req, res) => {
  const userId = req.user?.id || null;
  let customDir = null;
  if (userId) {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'custom_storage_dir' AND user_id = ?").get(userId);
      if (row && row.value) customDir = row.value.trim();
    } catch (_) {}
  }
  const activeDir = (customDir && fs.existsSync(customDir)) ? customDir : config.uploadDir;

  res.json({
    ok: 1,
    isDesktop: config.isDesktop || false,
    activeDir,
    defaultDir: config.uploadDir,
    customDir: customDir || null,
    canOpenFolder: process.platform === 'win32' || process.platform === 'darwin'
  });
});

router.post('/storage/open-local-folder', (req, res) => {
  try {
    const userId = req.user?.id || null;
    let targetDir = req.body?.folderPath;
    if (!targetDir && userId) {
      try {
        const row = db.prepare("SELECT value FROM settings WHERE key = 'custom_storage_dir' AND user_id = ?").get(userId);
        if (row && row.value) targetDir = row.value.trim();
      } catch (_) {}
    }
    if (!targetDir) targetDir = config.uploadDir;

    if (!fs.existsSync(targetDir)) {
      try { fs.mkdirSync(targetDir, { recursive: true }); } catch (_) {}
    }

    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec(`explorer "${targetDir}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${targetDir}"`);
    } else {
      exec(`xdg-open "${targetDir}"`);
    }

    res.json({ ok: 1, opened: true, path: targetDir });
  } catch (err) {
    res.status(500).json({ ok: 0, error: err.message });
  }
});

router.post('/storage/set-local-folder', (req, res) => {
  const userId = req.user?.id || null;
  const folderPath = req.body?.folderPath ? String(req.body.folderPath).trim() : null;
  if (!folderPath) {
    return res.status(400).json({ ok: 0, error: 'Please provide a valid directory path' });
  }

  try {
    if (!fs.existsSync(folderPath)) {
      try { fs.mkdirSync(folderPath, { recursive: true }); } catch (_) {}
    }

    // Automatically ensure resumes and cover_letter subfolders exist
    const resumeDir = path.join(folderPath, 'resumes');
    const resumeAltDir = path.join(folderPath, 'resume');
    if (!fs.existsSync(resumeDir) && !fs.existsSync(resumeAltDir)) {
      try { fs.mkdirSync(resumeDir, { recursive: true }); } catch (_) {}
    }

    const coverLetterDir = path.join(folderPath, 'cover_letter');
    const coverLettersAltDir = path.join(folderPath, 'cover_letters');
    if (!fs.existsSync(coverLetterDir) && !fs.existsSync(coverLettersAltDir)) {
      try { fs.mkdirSync(coverLetterDir, { recursive: true }); } catch (_) {}
    }

    if (userId) {
      db.prepare(`
        INSERT INTO settings (key, value, user_id)
        VALUES ('custom_storage_dir', ?, ?)
        ON CONFLICT(key, user_id) DO UPDATE SET value = excluded.value
      `).run(folderPath, userId);
    }
    res.json({
      ok: 1,
      folderPath,
      message: 'Local storage folder and resumes/cover_letter subfolders updated successfully',
      subfolders: ['resumes', 'cover_letter']
    });
  } catch (err) {
    res.status(500).json({ ok: 0, error: `Failed to set storage directory: ${err.message}` });
  }
});

// Storage Status & Multi-User Google Drive Settings
router.get('/storage/status', (req, res) => {
  const userId = req.user?.id || null;
  if (!userId) {
    return res.json({
      ok: 1,
      provider: config.storageProvider,
      connected: false,
      folderId: null,
      serviceAccountReady: false,
      userEmail: null
    });
  }
  let userFolderId = null;
  let userEmail = req.user?.email || null;

  try {
    const userRow = db.prepare('SELECT email, gdrive_folder_id FROM users WHERE id = ?').get(userId);
    if (userRow) {
      userFolderId = userRow.gdrive_folder_id || null;
      userEmail = userRow.email || userEmail;
    }
  } catch (_) {}

  const activeFolderId = userFolderId || config.googleDriveFolderId || null;
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
  const userId = req.user?.id || null;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
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
  const userId = req.user?.id || null;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { signToken } = require('../services/jwtService');
  const token = signToken({ id: userId, email: req.user?.email || '', scope: 'file_view' }, 3600);
  res.json({ ok: 1, token });
});

router.post('/storage/test-connection', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
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
