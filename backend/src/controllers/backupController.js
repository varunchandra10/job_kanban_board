const fs = require('fs');
const path = require('path');
const archiverModule = require('archiver');
const config = require('../config');

function createZipArchive(options) {
  if (typeof archiverModule === 'function') {
    return archiverModule('zip', options);
  }
  if (archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options);
  }
  throw new Error('Unsupported archiver module structure');
}

exports.exportZip = (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `job-tracker-backup-${timestamp}.zip`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'application/zip');

    const archive = createZipArchive({
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

    archive.finalize();
  } catch (err) {
    next(err);
  }
};

exports.backupDatabase = (req, res, next) => {
  try {
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
    const { db } = require('../database/db');
    const apps = db.prepare('SELECT * FROM applications ORDER BY id ASC').all();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
    const filename = `job-applications-${timestamp}.csv`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    const headers = [
      'id', 'company', 'role', 'stage', 'category', 'date_applied', 'deadline',
      'country', 'city', 'salary', 'currency', 'portal_url', 'portal_user',
      'custom_tags', 'notes', 'created_at', 'updated_at'
    ];

    const esc = val => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const csvLines = [
      headers.map(esc).join(','),
      ...apps.map(a => headers.map(h => esc(a[h])).join(','))
    ];

    res.send('﻿' + csvLines.join('\r\n'));
  } catch (err) {
    next(err);
  }
};
