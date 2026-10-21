const { exec } = require('child_process');
const { db } = require('../database/db');
const { storageService } = require('../services/storageService');

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
      ext: saved.ext
    });
  } catch (err) {
    next(err);
  }
};

exports.getFileInfo = (req, res, next) => {
  try {
    const targetPath = req.body.path || req.query.path;
    const info = storageService.getFileInfo(targetPath);
    res.json(info);
  } catch (err) {
    next(err);
  }
};

exports.getFileContent = (req, res, next) => {
  try {
    const targetPath = req.query.path;
    const fileResult = storageService.getFileStream(targetPath);

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

exports.openFile = (req, res, next) => {
  try {
    const p = storageService.resolveSafePath(req.body.path);
    const info = storageService.getFileInfo(p);
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

exports.revealFile = (req, res, next) => {
  try {
    const p = storageService.resolveSafePath(req.body.path);
    const info = storageService.getFileInfo(p);
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
