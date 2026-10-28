const fs = require('fs');
const path = require('path');
const config = require('../config');
const { db, decryptCredential } = require('../database/db');
const { storageService } = require('../services/storageService');

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
    const userId = req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to download user backup' });
    }

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

    // 1. Fetch strictly user-scoped database records
    const rawApplications = db.prepare('SELECT * FROM applications WHERE user_id=? ORDER BY position, id').all(userId);
    const applications = rawApplications.map(app => {
      if (app.portal_pass) {
        return { ...app, portal_pass: decryptCredential(app.portal_pass) };
      }
      return app;
    });
    const profile = db.prepare('SELECT * FROM resume_profile WHERE user_id=? LIMIT 1').get(userId) || null;
    const versions = db.prepare("SELECT id, label, region, text, pdf_name, user_id, (pdf_data IS NOT NULL AND pdf_data != '') as has_pdf FROM resume_versions WHERE user_id=? ORDER BY id").all(userId);
    const activity = db.prepare('SELECT * FROM activity_log WHERE user_id=? ORDER BY id DESC').all(userId);
    const settings = Object.fromEntries(
      db.prepare('SELECT key, value FROM settings WHERE user_id=?').all(userId).map(r => [r.key, r.value])
    );
    const userRow = db.prepare('SELECT id, email, name, avatar_url, created_at FROM users WHERE id=?').get(userId);

    const backupPayload = {
      manifest_version: '1.0.0',
      exported_at: new Date().toISOString(),
      user: userRow || { id: userId, email: req.user?.email || '', name: req.user?.name || '' },
      profile,
      applications,
      resume_versions: versions,
      activity_log: activity,
      settings
    };

    // 2. Add JSON data dump
    archive.append(JSON.stringify(backupPayload, null, 2), { name: 'data/job-tracker-data.json' });

    // 3. Add applications CSV export
    const headers = [
      'id', 'company', 'role', 'stage', 'category', 'date_applied', 'deadline',
      'country', 'city', 'salary', 'currency', 'portal_url', 'portal_user',
      'custom_tags', 'recruiter_name', 'recruiter_email', 'recruiter_notes',
      'portal_notes', 'resume_path', 'cover_letter_path'
    ];
    const esc = val => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.map(esc).join(','),
      ...applications.map(a => headers.map(h => esc(a[h])).join(','))
    ].join('\r\n');
    archive.append(csvContent, { name: 'data/applications.csv' });

    // 4. Collect and package ONLY the user's files
    const addedFiles = new Set();

    // From document_files table (local stored resumes/cover letters)
    try {
      const docs = db.prepare('SELECT id, type, name, mime_type, data FROM document_files WHERE user_id=?').all(userId);
      for (const doc of docs) {
        if (doc.data) {
          const sub = (doc.type === 'cover_letter' || doc.type === 'cover_letters') ? 'cover_letters' : 'resumes';
          const safeName = path.basename(doc.name || 'document.pdf').replace(/[^a-zA-Z0-9._ -]/g, '_');
          const zipPath = `documents/${sub}/${safeName}`;
          if (!addedFiles.has(zipPath)) {
            addedFiles.add(zipPath);
            archive.append(Buffer.from(doc.data, 'base64'), { name: zipPath });
          }
        }
      }
    } catch (docErr) {
      console.warn('[Backup] document_files export warning:', docErr.message);
    }

    // From applications table (local disk files referenced by resume_path / cover_letter_path)
    for (const app of applications) {
      for (const col of ['resume_path', 'cover_letter_path']) {
        const rawPath = app[col];
        if (rawPath && typeof rawPath === 'string' && !rawPath.startsWith('http') && !rawPath.includes('doc_id=')) {
          const resolved = storageService.resolveSafePath(rawPath);
          if (resolved && fs.existsSync(resolved)) {
            const sub = (col === 'cover_letter_path') ? 'cover_letters' : 'resumes';
            const safeName = path.basename(resolved).replace(/[^a-zA-Z0-9._ -]/g, '_');
            const zipPath = `documents/${sub}/${safeName}`;
            if (!addedFiles.has(zipPath)) {
              addedFiles.add(zipPath);
              archive.file(resolved, { name: zipPath });
            }
          }
        }
      }
    }

    // From resume_versions table (version PDFs)
    try {
      const pdfVersions = db.prepare("SELECT label, pdf_name, pdf_data FROM resume_versions WHERE user_id=? AND pdf_data IS NOT NULL AND pdf_data != ''").all(userId);
      for (const v of pdfVersions) {
        const name = path.basename(v.pdf_name || `${v.label || 'version'}.pdf`).replace(/[^a-zA-Z0-9._ -]/g, '_');
        const zipPath = `documents/versions/${name}`;
        if (!addedFiles.has(zipPath)) {
          addedFiles.add(zipPath);
          const buf = Buffer.isBuffer(v.pdf_data) ? v.pdf_data : Buffer.from(v.pdf_data, 'base64');
          archive.append(buf, { name: zipPath });
        }
      }
    } catch (_) {}

    // 5. Add README summary manifest
    const readme = [
      '==============================================================',
      ' JOB TRACKER - USER DATA & DOCUMENT ARCHIVE',
      '==============================================================',
      '',
      `Account Email : ${userRow?.email || req.user?.email || 'N/A'}`,
      `User ID       : ${userId}`,
      `Exported At   : ${new Date().toISOString()}`,
      `Applications  : ${applications.length}`,
      `Files Included: ${addedFiles.size}`,
      '',
      'ARCHIVE STRUCTURE:',
      '  data/job-tracker-data.json  - Complete JSON structured backup (applications, profile, versions)',
      '  data/applications.csv       - Application records formatted for Excel / Google Sheets',
      '  documents/resumes/          - Resumes belonging exclusively to this account',
      '  documents/cover_letters/    - Cover letters belonging exclusively to this account',
      '  documents/versions/         - Resume version PDFs',
      '',
      'All records in this archive are isolated strictly to your account.',
      '=============================================================='
    ].join('\r\n');

    archive.append(readme, { name: 'README.txt' });

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

exports.backupDatabase = (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required for database backup' });
    }

    // Only allow physical server-side file copying in local desktop mode
    if (!config.isDesktop && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Direct physical database snapshot is restricted to local desktop environment' });
    }

    if (!fs.existsSync(config.dbPath)) {
      return res.status(404).json({ error: 'Database file not found on local disk' });
    }

    try { db.exec('PRAGMA wal_checkpoint(PASSIVE);'); } catch (_) {}
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = config.backupDir || path.dirname(config.dbPath);
    if (!fs.existsSync(backupDir)) {
      try { fs.mkdirSync(backupDir, { recursive: true }); } catch (_) {}
    }
    const backupFile = path.join(backupDir, `${path.basename(config.dbPath)}.${timestamp}.bak`);
    fs.copyFileSync(config.dbPath, backupFile);

    res.json({
      ok: 1,
      backupFile: path.basename(backupFile)
    });
  } catch (err) {
    next(err);
  }
};

exports.exportCsv = (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to export CSV' });
    }
    const apps = db.prepare('SELECT * FROM applications WHERE user_id=? ORDER BY position, id ASC').all(userId);
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
