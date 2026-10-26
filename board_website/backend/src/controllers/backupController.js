const fs = require('fs');
const path = require('path');
const config = require('../config');
const { db } = require('../database/db');

async function createZipArchive(options) {
  const mod = await import('archiver');
  if (mod.ZipArchive) {
    return new mod.ZipArchive(options);
  }
  const archiverFn = mod.default || mod;
  if (typeof archiverFn === 'function') {
    return archiverFn('zip', options);
  }
  throw new Error('Could not initialize ZIP archive engine');
}

exports.exportZip = async (req, res, next) => {
  try {
    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (_) {}
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `job-tracker-backup-${timestamp}.zip`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'application/zip');

    const archive = await createZipArchive({
      zlib: { level: 9 }
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('[Backup] Archiver warning:', err);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      console.error('[Backup] Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    archive.pipe(res);

    if (fs.existsSync(config.dbPath)) {
      archive.file(config.dbPath, { name: 'tracker.db' });
    }

    if (fs.existsSync(config.uploadDir)) {
      archive.directory(config.uploadDir, 'documents');
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

exports.backupDatabase = (req, res, next) => {
  try {
    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (_) {}
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = `${config.dbPath}.${timestamp}.bak`;
    fs.copyFileSync(config.dbPath, backupFile);
    res.json({
      ok: 1,
      backupFile: path.basename(backupFile),
      path: backupFile
    });
  } catch (err) {
    next(err);
  }
};

exports.exportCsv = (req, res, next) => {
  try {
    const userId = req.user?.id || (!config.isVercel && !config.appPin ? 'default_user' : null);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to export CSV' });
    }
    const apps = db.prepare('SELECT * FROM applications WHERE user_id=? ORDER BY id ASC').all(userId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
    const filename = `job-applications-${timestamp}.csv`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    const headers = [
      'id', 'company', 'role', 'stage', 'category', 'date_applied', 'deadline',
      'country', 'city', 'salary', 'currency', 'portal_url', 'portal_user',
      'custom_tags', 'recruiter_name', 'recruiter_email', 'recruiter_notes',
      'portal_notes', 'resume_path', 'cover_letter_path'
    ];

    const esc = val => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const csvLines = [
      headers.map(esc).join(','),
      ...apps.map(a => headers.map(h => esc(a[h])).join(','))
    ];

    res.send('\uFEFF' + csvLines.join('\r\n'));
  } catch (err) {
    next(err);
  }
};
