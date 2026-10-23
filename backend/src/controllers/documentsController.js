const { exec } = require('child_process');
const { db } = require('../database/db');
const { storageService } = require('../services/storageService');
const config = require('../config');

exports.listDriveFiles = async (req, res, next) => {
  try {
    const type = req.query.type || 'resume';
    const resumeFolderId = '1JOyn_Fzafuc56FfYsjrgN1Z1TDv6l7QP';
    const coverFolderId = '1TyQOkbqrsc0yJ65oH4qbjNdRntzFjU62';
    const targetFolder = (type === 'cover' || type === 'cover_letter') ? coverFolderId : resumeFolderId;

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

    // If STORAGE_PROVIDER is google_drive, check if this file exists in user's Drive folder!
    if (config.storageProvider === 'google_drive' && storageService.driveClient && originalName) {
      try {
        const resumeFolderId = '1JOyn_Fzafuc56FfYsjrgN1Z1TDv6l7QP';
        const coverFolderId = '1TyQOkbqrsc0yJ65oH4qbjNdRntzFjU62';
        const isCover = type === 'cover_letter' || type === 'cover_letter_path';
        const subfolderId = isCover ? coverFolderId : resumeFolderId;

        const driveSearch = await storageService.driveClient.files.list({
          q: `name = '${originalName.replace(/'/g, "\\'")}' and trashed = false and ('${subfolderId}' in parents or '${config.googleDriveFolderId}' in parents)`,
          fields: 'files(id, name, webViewLink, size)',
          pageSize: 1
        });

        if (driveSearch.data.files && driveSearch.data.files.length > 0) {
          const found = driveSearch.data.files[0];
          const gdriveLink = `https://drive.google.com/file/d/${found.id}/view`;
          if (appId) {
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

    const saved = await storageService.saveFile({
      buffer: fileBuffer,
      originalName,
      type,
      appId
    });

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
    const targetPath = (req.body && req.body.path) || (req.query && req.query.path); if (!targetPath) return res.status(400).json({ error: 'No path specified' });
    const info = await storageService.getFileInfo(targetPath);
    res.json(info);
  } catch (err) {
    next(err);
  }
};

exports.getFileContent = async (req, res, next) => {
  try {
    const targetPath = req.query.path;
    const fileResult = await storageService.getFileStream(targetPath);

    if (!fileResult.exists) {
      return res.status(404).json({ error: fileResult.error || 'File not found', path: targetPath });
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
    const p = await storageService.resolveSafePath(req.body.path);
    const info = await storageService.getFileInfo(p);
    if (!info.exists) {
      return res.status(404).json({ ok: 0, error: 'File not found' });
    }

    if (process.platform === 'win32') {
      exec(`start "" "${p}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${p}"`);
    } else {
      exec(`xdg-open "${p}"`);
    }

    res.json({ ok: 1 });
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
