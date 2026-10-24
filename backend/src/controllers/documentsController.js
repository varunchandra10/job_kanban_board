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
      return res.json({
        ok: 1,
        files: [],
        notConfigured: true,
        message: 'No personal Google Drive folder connected. Please connect your folder in Career Profile.'
      });
    }

    if (!storageService.driveClient) {
      return res.json({ ok: 1, files: [] });
    }

    const driveRes = await storageService.driveClient.files.list({
      q: `'${targetFolder}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, size)',
      pageSize: 50,
      orderBy: 'name'
    });

    res.json({
      ok: 1,
      folderId: targetFolder,
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
    const type = req.body.type || req.body.targetKey;
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

    // Get user's Google Drive folder from request body, database, or config
    let userFolderId = req.body.folderId ? String(req.body.folderId).trim() : null;
    if (userFolderId && userFolderId.includes('folders/')) {
      const m = userFolderId.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (m) userFolderId = m[1];
    }

    if (!userFolderId) {
      try {
        const userRow = db.prepare('SELECT gdrive_folder_id FROM users WHERE id = ?').get(userId);
        if (userRow && userRow.gdrive_folder_id) {
          userFolderId = userRow.gdrive_folder_id.trim();
        }
      } catch (_) {}
    }

    if (!userFolderId && config.googleDriveFolderId) {
      userFolderId = config.googleDriveFolderId;
    }

    // Check if duplicate file already exists in Drive folder to avoid re-uploading
    if (config.storageProvider === 'google_drive' && userFolderId && storageService.driveClient && originalName) {
      try {
        const driveSearch = await storageService.driveClient.files.list({
          q: `name = '${originalName.replace(/'/g, "\\'")}' and trashed = false and '${userFolderId}' in parents`,
          fields: 'files(id, name, webViewLink, size)',
          pageSize: 1
        });

        if (driveSearch.data.files && driveSearch.data.files.length > 0) {
          const found = driveSearch.data.files[0];
          const gdriveLink = `https://drive.google.com/file/d/${found.id}/view`;
          if (appId) {
            const isCover = type === 'cover_letter' || type === 'cover_letter_path';
            const col = isCover ? 'cover_letter_path' : 'resume_path';
            db.prepare(`update applications set ${col}=? where id=?`).run(gdriveLink, appId);
          }
          return res.json({
            ok: 1,
            fullPath: gdriveLink,
            path: gdriveLink,
            relativePath: gdriveLink,
            name: found.name,
            size: found.size,
            isGoogleDrive: true,
            fileId: found.id
          });
        }
      } catch (searchErr) {
        console.warn('[Google Drive] Search error:', searchErr.message);
      }
    }

    let saved;
    try {
      if (userFolderId && storageService && typeof storageService.saveFile === 'function' && storageService !== localService) {
        saved = await storageService.saveFile({
          buffer: fileBuffer,
          originalName,
          type,
          appId,
          folderId: userFolderId
        });
      } else if (!config.isVercel) {
        const fallbackTarget = (storageService && storageService.localFallback) ? storageService.localFallback : localService;
        saved = await fallbackTarget.saveFile({
          buffer: fileBuffer,
          originalName,
          type,
          appId
        });
        if (!userFolderId) {
          saved.notice = 'Saved locally. Link your Google Drive folder in Career Profile to backup to cloud.';
        }
      } else {
        return res.status(400).json({
          ok: 0,
          error: 'Google Drive folder not configured. Please link your personal Google Drive folder in Career Profile or click "Link Drive" to paste the document link.',
          isGoogleDriveQuota: true
        });
      }
    } catch (saveErr) {
      console.warn('[Storage] Primary save failed:', saveErr.message);
      if (config.isVercel) {
        const isQuota = /quota/i.test(saveErr.message) || /Service Accounts do not have storage quota/i.test(saveErr.message);
        return res.status(400).json({
          ok: 0,
          error: isQuota
            ? 'Google Drive restricts service accounts from uploading files into personal Google accounts (0 MB storage quota). Please upload to your Google Drive and click "Link Drive" to attach it directly.'
            : 'Google Drive upload error: ' + saveErr.message,
          isGoogleDriveQuota: true
        });
      }
      const fallbackTarget = (storageService && storageService.localFallback) ? storageService.localFallback : localService;
      saved = await fallbackTarget.saveFile({
        buffer: fileBuffer,
        originalName,
        type,
        appId
      });
      saved.notice = 'Saved locally due to error: ' + saveErr.message;
    }

    if (appId) {
      const isCover = type === 'cover_letter' || type === 'cover_letter_path';
      const col = isCover ? 'cover_letter_path' : 'resume_path';
      try {
        db.prepare(`update applications set ${col}=? where id=?`).run(saved.fullPath, appId);
      } catch (dbErr) {
        console.warn('DB update warning on upload:', dbErr.message);
      }
    }

    res.json({
      ok: 1,
      fullPath: saved.fullPath,
      path: saved.fullPath,
      relativePath: saved.relativePath,
      name: saved.name,
      size: saved.size,
      ext: saved.ext,
      isGoogleDrive: !!saved.isGoogleDrive
    });
  } catch (err) {
    next(err);
  }
};

exports.getFileInfo = async (req, res, next) => {
  try {
    const targetPath = (req.body && req.body.path) || (req.query && req.query.path);
    if (!targetPath) return res.status(400).json({ error: 'No path specified' });
    const info = await storageService.getFileInfo(targetPath);
    res.json({ ok: 1, ...info });
  } catch (err) {
    next(err);
  }
};

exports.getFileContent = async (req, res, next) => {
  try {
    const targetPath = req.query.path;
    if (!targetPath) return res.status(400).send('No file path provided');

    if (/^https?:\/\//i.test(targetPath)) {
      return res.redirect(targetPath);
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
            .badge { background: #1e293b; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all; }
            .btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; text-decoration: none; font-weight: 500; font-size: 14px; padding: 10px 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Document Stored in Google Drive</h2>
            <p>The document (<span class="badge">${encodeURIComponent(fileName)}</span>) was saved in temporary server storage or directly on Google Drive.</p>
            <p>Please open the application card on your <strong>Kanban Board</strong> and click <strong>"Link Drive"</strong> to attach its permanent Google Drive link.</p>
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
    try {
      deleted = await storageService.deleteFile(filePath);
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
