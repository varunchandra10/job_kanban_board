const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { db } = require('../database/db');
const { storageService, localService } = require('../services/storageService');
const config = require('../config');

exports.listDriveFiles = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    let targetFolder = null;

    try {
      const userRow = db.prepare('SELECT gdrive_folder_id FROM users WHERE id = ?').get(userId);
      if (userRow && userRow.gdrive_folder_id) {
        targetFolder = userRow.gdrive_folder_id.trim();
      }
    } catch (_) {}

    if (!targetFolder) {
      targetFolder = config.googleDriveFolderId || '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_';
    }

    if (!storageService.driveClient) {
      return res.json({ ok: 1, files: [] });
    }

    const type = (req.query.type || '').toLowerCase();
    let queryFolder = targetFolder;
    if (targetFolder === '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_') {
      if (type.includes('resume')) queryFolder = '1JOyn_Fzafuc56FfYsjrgN1Z1TDv6l7QP';
      else if (type.includes('cover')) queryFolder = '1TyQOkbqrsc0yJ65oH4qbjNdRntzFjU62';
    }

    const driveRes = await storageService.driveClient.files.list({
      q: `'${queryFolder}' in parents and trashed = false`,
      supportsAllDrives: true,
      fields: 'files(id, name, mimeType, webViewLink, size)',
      pageSize: 50,
      orderBy: 'name'
    });

    res.json({
      ok: 1,
      folderId: queryFolder,
      files: (driveRes.data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        url: `https://drive.google.com/file/d/${f.id}/view`
      }))
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user?.id || 'default_user';
    let fileBuffer;
    let originalName;
    const type = req.body.type || req.body.targetKey || 'resume';
    const appId = req.body.appId ? parseInt(req.body.appId, 10) : null;

    if (req.file) {
      fileBuffer = req.file.buffer;
      originalName = req.file.originalname;
    } else if (req.body && req.body.data) {
      originalName = req.body.name;
      const dataStr = req.body.data.includes(',') ? req.body.data.split(',')[1] : req.body.data;
      fileBuffer = Buffer.from(dataStr, 'base64');
    } else {
      return res.status(400).json({ error: 'No file data received' });
    }

    const storageMode = (req.body.storageMode || req.headers['x-storage-mode'] || '').toLowerCase();

    // If storage mode is local/local_storage, store securely in the database document_files table
    if (storageMode === 'local' || storageMode === 'local_storage') {
      const docId = `doc_${crypto.randomUUID()}`;
      const mimeType = req.file ? req.file.mimetype : 'application/pdf';

      try {
        db.prepare(`
          INSERT INTO document_files (id, user_id, app_id, type, name, mime_type, data, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          docId,
          userId,
          appId,
          type,
          originalName || 'document.pdf',
          mimeType,
          fileBuffer.toString('base64')
        );
      } catch (dbErr) {
        console.error('[Document Files Local Storage Error]:', dbErr.message);
        throw new Error(`Failed to store document in local database: ${dbErr.message}`);
      }

      const viewPath = `/api/document-content?doc_id=${docId}&name=${encodeURIComponent(originalName || 'document.pdf')}`;
      let savedDiskPath = null;
      let activeLocalDir = config.uploadDir;

      // Also persist physical copy to local hard drive if directory is accessible
      try {
        const fs = require('fs');
        const customCandidate = req.body?.customDir || req.headers?.['x-custom-storage-dir'];
        if (customCandidate && typeof customCandidate === 'string' && fs.existsSync(customCandidate.trim())) {
          activeLocalDir = customCandidate.trim();
        } else if (userId) {
          const row = db.prepare("SELECT value FROM settings WHERE key = 'custom_storage_dir' AND user_id = ?").get(userId);
          if (row && row.value && fs.existsSync(row.value.trim())) {
            activeLocalDir = row.value.trim();
          }
        }
        if (activeLocalDir) {
          if (!fs.existsSync(activeLocalDir)) {
            try { fs.mkdirSync(activeLocalDir, { recursive: true }); } catch (_) {}
          }

          // Automatically ensure resumes and cover_letter subfolders exist
          const resumesDir = path.join(activeLocalDir, 'resumes');
          const resumeAltDir = path.join(activeLocalDir, 'resume');
          if (!fs.existsSync(resumesDir) && !fs.existsSync(resumeAltDir)) {
            try { fs.mkdirSync(resumesDir, { recursive: true }); } catch (_) {}
          }

          const coverLetterDir = path.join(activeLocalDir, 'cover_letter');
          const coverLettersAltDir = path.join(activeLocalDir, 'cover_letters');
          if (!fs.existsSync(coverLetterDir) && !fs.existsSync(coverLettersAltDir)) {
            try { fs.mkdirSync(coverLetterDir, { recursive: true }); } catch (_) {}
          }

          const isCover = type === 'cover_letter' || type === 'cover_letters';
          let targetSubDir = isCover
            ? (fs.existsSync(coverLetterDir) ? coverLetterDir : (fs.existsSync(coverLettersAltDir) ? coverLettersAltDir : coverLetterDir))
            : (fs.existsSync(resumesDir) ? resumesDir : (fs.existsSync(resumeAltDir) ? resumeAltDir : resumesDir));

          if (!fs.existsSync(targetSubDir)) {
            try { fs.mkdirSync(targetSubDir, { recursive: true }); } catch (_) {}
          }

          const safeName = path.basename(originalName || (isCover ? 'cover_letter.pdf' : 'resume.pdf'))
            .replace(/[^a-zA-Z0-9._ -]/g, '_');
          const diskTarget = path.join(targetSubDir, safeName);
          fs.writeFileSync(diskTarget, fileBuffer);
          savedDiskPath = diskTarget;
        }
      } catch (diskErr) {
        console.warn('[Local Storage Disk Write Note]:', diskErr.message);
      }

      if (appId) {
        const isCover = type === 'cover_letter' || type === 'cover_letters' || type === 'cover_letter_path';
        const col = isCover ? 'cover_letter_path' : 'resume_path';
        try {
          db.prepare(`UPDATE applications SET ${col} = ? WHERE id = ?`).run(viewPath, appId);
        } catch (dbErr) {
          console.warn(`[Database] Note updating ${col} for app ${appId}:`, dbErr.message);
        }
      }

      return res.json({
        ok: 1,
        fullPath: viewPath,
        path: viewPath,
        relativePath: viewPath,
        name: originalName || 'document.pdf',
        size: fileBuffer.length,
        ext: path.extname(originalName || '').toLowerCase(),
        isLocalStorage: true,
        isGoogleDrive: false,
        docId,
        localDirectory: activeLocalDir,
        savedDiskPath
      });
    }

    // Get user's Google Drive folder from request body, database, or config
    let userFolderId = req.body.folderId ? String(req.body.folderId).trim() : null;
    if (userFolderId && userFolderId.includes('folders/')) {
      const m = userFolderId.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (m) userFolderId = m[1];
    }

    let userRefreshToken = null;
    if (userId) {
      try {
        const userRow = db.prepare('SELECT gdrive_folder_id, google_refresh_token FROM users WHERE id = ?').get(userId);
        if (userRow) {
          if (!userFolderId && userRow.gdrive_folder_id) {
            userFolderId = userRow.gdrive_folder_id.trim();
          }
          if (userRow.google_refresh_token) {
            userRefreshToken = userRow.google_refresh_token.trim();
          }
        }
      } catch (_) {}
    }

    if (!userFolderId) {
      userFolderId = config.googleDriveFolderId || '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_';
    }

    // Upload directly to Google Drive in its respective subfolder (resumes / cover_letters)
    const GoogleDriveStorageService = require('../services/googleDriveStorageService');
    const driveService = (storageService instanceof GoogleDriveStorageService)
      ? storageService
      : new GoogleDriveStorageService({ folderId: userFolderId });

    const userAccessToken = req.headers['x-google-access-token'] || req.body.googleAccessToken || (req.headers['authorization']?.startsWith('Bearer ya29.') ? req.headers['authorization'].slice(7) : null);

    const saved = await driveService.saveFile({
      buffer: fileBuffer,
      originalName,
      type,
      appId,
      folderId: userFolderId,
      userAccessToken,
      userRefreshToken
    });

    if (!saved || !saved.fullPath) {
      throw new Error('Google Drive upload did not return a valid file link');
    }

    // Save ONLY the Google Drive view link (string) into Turso SQLite
    if (appId) {
      const isCover = type === 'cover_letter' || type === 'cover_letters' || type === 'cover_letter_path';
      const col = isCover ? 'cover_letter_path' : 'resume_path';
      try {
        db.prepare(`UPDATE applications SET ${col} = ? WHERE id = ?`).run(saved.fullPath, appId);
      } catch (dbErr) {
        console.warn(`[Database] Note updating ${col} for app ${appId}:`, dbErr.message);
      }
    }

    // Persist user's root Google Drive folder so all subsequent uploads use the same root
    if (userId && saved.rootFolderId && userId !== 'default_user') {
      try {
        db.prepare('UPDATE users SET gdrive_folder_id = ? WHERE id = ?').run(saved.rootFolderId, userId);
      } catch (dbErr) {
        console.warn(`[Database] Note saving user gdrive_folder_id:`, dbErr.message);
      }
    }

    return res.json({
      ok: 1,
      fullPath: saved.fullPath,
      path: saved.fullPath,
      relativePath: saved.relativePath || saved.fullPath,
      name: saved.name || originalName,
      size: saved.size || fileBuffer.length,
      ext: saved.ext,
      isGoogleDrive: true,
      fileId: saved.fileId,
      rootFolderId: saved.rootFolderId,
      folderId: saved.folderId
    });
  } catch (err) {
    console.error('[Upload Document Error]:', err.message);
    let msg = err.message || 'Unknown upload error';
    let needsAuth = false;
    if (
      msg.includes('Google Drive service is not configured with credentials') ||
      msg.includes('Google Drive folder not configured') ||
      msg.includes('quota') ||
      msg.includes('Service Accounts do not have storage quota') ||
      msg.includes('invalid_grant') ||
      msg.includes('invalid_token')
    ) {
      msg = 'Google Drive requires authorization with your Google Account. Please open Google Drive Settings (cloud icon in header) and click "Authorize" to enable direct Google Drive uploads.';
      needsAuth = true;
    }
    return res.status(500).json({
      ok: 0,
      needsAuth,
      error: `Google Drive upload failed: ${msg}`
    });
  }
};

exports.getFileInfo = async (req, res, next) => {
  try {
    const targetPath = (req.body && req.body.path) || (req.query && req.query.path);
    if (!targetPath) return res.status(400).json({ error: 'No path specified' });

    if (targetPath.includes('doc_id=')) {
      const m = targetPath.match(/doc_id=([a-zA-Z0-9_-]+)/);
      if (m) {
        try {
          const doc = db.prepare('SELECT name, mime_type, length(data) as len FROM document_files WHERE id = ?').get(m[1]);
          if (doc) {
            return res.json({
              ok: 1,
              exists: true,
              name: doc.name,
              size: Math.round(doc.len * 0.75),
              ext: path.extname(doc.name).toLowerCase(),
              resolvedPath: targetPath
            });
          }
        } catch (_) {}
      }
    }

    const info = await storageService.getFileInfo(targetPath);
    res.json({ ok: 1, ...info });
  } catch (err) {
    next(err);
  }
};

exports.getFileContent = async (req, res, next) => {
  try {
    let docId = req.query.doc_id || req.query.id;
    let targetPath = req.query.path;

    if (!docId && targetPath) {
      if (targetPath.includes('doc_id=')) {
        const m = targetPath.match(/doc_id=([a-zA-Z0-9_-]+)/);
        if (m) docId = m[1];
      } else if (/^doc_[a-zA-Z0-9_-]+$/.test(targetPath.trim())) {
        docId = targetPath.trim();
      }
    }

    if (docId) {
      try {
        const doc = db.prepare('SELECT name, mime_type, data, user_id FROM document_files WHERE id = ?').get(docId);
        if (doc) {
          const callerId = req.user?.id;
          if (doc.user_id && doc.user_id !== 'default_user' && callerId && callerId !== doc.user_id) {
            return res.status(403).send('Unauthorized document access');
          }

          const buf = Buffer.from(doc.data, 'base64');
          res.writeHead(200, {
            'Content-Type': doc.mime_type || 'application/pdf',
            'Content-Length': buf.length,
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
            'Cache-Control': 'private, max-age=86400'
          });
          return res.end(buf);
        } else if (!targetPath) {
          return res.status(404).send('Document not found or has been removed from local storage');
        }
      } catch (docErr) {
        console.warn('[Documents] document_files fetch error:', docErr.message);
        if (!targetPath) {
          return res.status(500).send('Error retrieving document content');
        }
      }
    }

    if (!targetPath && !docId) return res.status(400).send('No file path or document ID provided');

    if (targetPath) {
      // Check document_files by filename
      const bn = path.basename(targetPath);
      try {
        const doc = db.prepare('SELECT name, mime_type, data, user_id FROM document_files WHERE name = ? ORDER BY created_at DESC LIMIT 1').get(bn);
        if (doc) {
          const callerId = req.user?.id;
          if (doc.user_id && doc.user_id !== 'default_user' && callerId && callerId !== doc.user_id) {
            return res.status(403).send('Unauthorized document access');
          }

          const buf = Buffer.from(doc.data, 'base64');
          res.writeHead(200, {
            'Content-Type': doc.mime_type || 'application/octet-stream',
            'Content-Length': buf.length,
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
            'Cache-Control': 'private, max-age=86400'
          });
          return res.end(buf);
        }
      } catch (_) {}

      if (/^https?:\/\//i.test(targetPath)) {
        return res.redirect(targetPath);
      }
    }

    const fileResult = await storageService.getFileStream(targetPath);

    if (!fileResult.exists) {
      const fileName = path.basename(targetPath || 'document');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Document Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 14px; padding: 32px; max-width: 520px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h2 { font-size: 20px; margin: 0 0 12px; color: #f8fafc; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 20px; }
            .btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 10px 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Document Stored in Google Drive</h2>
            <p>The document (${fileName}) is not available in local server cache.</p>
            <a href="/board" class="btn">Return to Kanban Board</a>
          </div>
        </body>
        </html>
      `);
    }

    res.writeHead(200, {
      'content-type': fileResult.mime,
      'content-length': fileResult.size,
      'content-disposition': `inline; filename="${encodeURIComponent(fileResult.filename)}"`,
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*'
    });

    fileResult.stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

exports.openFile = async (req, res, next) => {
  try {
    const targetPath = (req.body && req.body.path) || (req.query && req.query.path);
    if (!targetPath) return res.status(400).json({ error: 'No path specified' });

    if (/^https?:\/\//i.test(targetPath)) {
      return res.json({ ok: 1, opened: true, url: targetPath });
    }

    const resolved = storageService.resolveSafePath(targetPath);
    if (!resolved) return res.status(404).json({ error: 'File path could not be resolved' });

    if (/^https?:\/\//i.test(resolved)) {
      return res.json({ ok: 1, opened: true, url: resolved });
    }

    const platform = process.platform;
    let cmd;
    if (platform === 'win32') {
      cmd = `start "" "${resolved}"`;
    } else if (platform === 'darwin') {
      cmd = `open "${resolved}"`;
    } else {
      cmd = `xdg-open "${resolved}"`;
    }

    exec(cmd, (err) => {
      if (err) return next(err);
      res.json({ ok: 1, opened: true, path: resolved });
    });
  } catch (err) {
    next(err);
  }
};

exports.revealFile = async (req, res, next) => {
  try {
    const p = await storageService.resolveSafePath(req.body.path);
    const info = await storageService.getFileInfo(p);
    if (!info.exists) {
      return res.status(404).json({ ok: 0, error: 'File not found' });
    }

    if (process.platform === 'win32') {
      exec(`explorer /select,"${p}"`);
    } else if (process.platform === 'darwin') {
      exec(`open -R "${p}"`);
    }

    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const filePath = req.body.path || req.query.path;
    const appId = req.body.appId ? parseInt(req.body.appId, 10) : null;
    const type = req.body.type || (req.body.key === 'resume_path' ? 'resume' : 'cover_letter');

    if (!filePath) {
      return res.status(400).json({ ok: 0, error: 'No file path provided' });
    }

    let deleted = false;
    if (filePath.includes('doc_id=')) {
      const m = filePath.match(/doc_id=([a-zA-Z0-9_-]+)/);
      if (m) {
        try {
          db.prepare('DELETE FROM document_files WHERE id = ?').run(m[1]);
          deleted = true;
        } catch (_) {}
      }
    }

    try {
      const resDel = await storageService.deleteFile(filePath);
      if (resDel) deleted = true;
    } catch (delErr) {
      console.warn('[Storage] Error deleting file:', delErr.message);
    }

    if (appId) {
      const isCover = type === 'cover' || type === 'cover_letter' || type === 'cover_letter_path';
      const col = isCover ? 'cover_letter_path' : 'resume_path';
      try {
        db.prepare(`update applications set ${col}='' where id=?`).run(appId);
      } catch (dbErr) {
        console.warn('DB update warning on delete:', dbErr.message);
      }
    }

    res.json({ ok: 1, deleted: !!deleted });
  } catch (err) {
    next(err);
  }
};
