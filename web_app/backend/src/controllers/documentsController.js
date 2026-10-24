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

    if (!userFolderId) {
      userFolderId = config.googleDriveFolderId || '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_';
    }

    // 1. Check if the file (or matching name) already exists in Google Drive
    if (storageService.driveClient && originalName) {
      try {
        const safeOriginal = originalName.replace(/'/g, "\\'");
        const driveSearch = await storageService.driveClient.files.list({
          q: `name = '${safeOriginal}' and trashed = false`,
          supportsAllDrives: true,
          fields: 'files(id, name, webViewLink, size)',
          pageSize: 1
        });

        if (driveSearch.data.files && driveSearch.data.files.length > 0) {
          const found = driveSearch.data.files[0];
          const gdriveLink = `https://drive.google.com/file/d/${found.id}/view`;
          if (appId) {
            const isCover = type === 'cover_letter' || type === 'cover_letter_path';
            const col = isCover ? 'cover_letter_path' : 'resume_path';
            try { db.prepare(`update applications set ${col}=? where id=?`).run(gdriveLink, appId); } catch (_) {}
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
        console.warn('[Google Drive] Search note:', searchErr.message);
      }
    }

    // 2. Try primary storageService saveFile
    let saved = null;
    if (storageService && typeof storageService.saveFile === 'function' && storageService !== localService) {
      try {
        saved = await storageService.saveFile({
          buffer: fileBuffer,
          originalName,
          type,
          appId,
          folderId: userFolderId
        });
      } catch (driveSaveErr) {
        console.warn('[Google Drive] Save note:', driveSaveErr.message);
      }
    }

    if (saved && saved.fullPath) {
      if (appId) {
        const isCover = type === 'cover_letter' || type === 'cover_letter_path';
        const col = isCover ? 'cover_letter_path' : 'resume_path';
        try { db.prepare(`update applications set ${col}=? where id=?`).run(saved.fullPath, appId); } catch (_) {}
      }
      return res.json({
        ok: 1,
        fullPath: saved.fullPath,
        path: saved.fullPath,
        relativePath: saved.relativePath || saved.fullPath,
        name: saved.name || originalName,
        size: saved.size || fileBuffer.length,
        ext: saved.ext || path.extname(originalName).toLowerCase(),
        isGoogleDrive: !!saved.isGoogleDrive
      });
    }

    // 3. Robust fallback: Store binary file in database `document_files` table
    const docId = 'doc_' + crypto.randomBytes(8).toString('hex');
    const { getMimeType } = require('../services/baseStorageService');
    const mimeType = getMimeType(originalName);
    const base64Data = fileBuffer.toString('base64');

    try {
      db.prepare(`
        INSERT INTO document_files (id, user_id, app_id, type, name, mime_type, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(docId, userId, appId, type, originalName, mimeType, base64Data);
    } catch (dbSaveErr) {
      console.warn('[Database] document_files save error:', dbSaveErr.message);
    }

    const docUrl = `/api/file-content?doc_id=${docId}`;
    if (appId) {
      const isCover = type === 'cover_letter' || type === 'cover_letter_path';
      const col = isCover ? 'cover_letter_path' : 'resume_path';
      try { db.prepare(`update applications set ${col}=? where id=?`).run(docUrl, appId); } catch (_) {}
    }

    return res.json({
      ok: 1,
      fullPath: docUrl,
      path: docUrl,
      relativePath: docUrl,
      name: originalName,
      size: fileBuffer.length,
      ext: path.extname(originalName).toLowerCase(),
      isGoogleDrive: false,
      docId
    });
  } catch (err) {
    next(err);
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
    const docId = req.query.doc_id || req.query.id;
    if (docId) {
      try {
        const doc = db.prepare('SELECT name, mime_type, data FROM document_files WHERE id = ?').get(docId);
        if (doc) {
          const buf = Buffer.from(doc.data, 'base64');
          res.writeHead(200, {
            'Content-Type': doc.mime_type || 'application/octet-stream',
            'Content-Length': buf.length,
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
            'Cache-Control': 'public, max-age=86400'
          });
          return res.end(buf);
        }
      } catch (_) {}
    }

    const targetPath = req.query.path;
    if (!targetPath && !docId) return res.status(400).send('No file path provided');

    if (targetPath) {
      if (targetPath.includes('doc_id=')) {
        const m = targetPath.match(/doc_id=([a-zA-Z0-9_-]+)/);
        if (m) {
          try {
            const doc = db.prepare('SELECT name, mime_type, data FROM document_files WHERE id = ?').get(m[1]);
            if (doc) {
              const buf = Buffer.from(doc.data, 'base64');
              res.writeHead(200, {
                'Content-Type': doc.mime_type || 'application/octet-stream',
                'Content-Length': buf.length,
                'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
                'Cache-Control': 'public, max-age=86400'
              });
              return res.end(buf);
            }
          } catch (_) {}
        }
      }

      // Check document_files by filename
      const bn = path.basename(targetPath);
      try {
        const doc = db.prepare('SELECT name, mime_type, data FROM document_files WHERE name = ? ORDER BY created_at DESC LIMIT 1').get(bn);
        if (doc) {
          const buf = Buffer.from(doc.data, 'base64');
          res.writeHead(200, {
            'Content-Type': doc.mime_type || 'application/octet-stream',
            'Content-Length': buf.length,
            'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`,
            'Cache-Control': 'public, max-age=86400'
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
