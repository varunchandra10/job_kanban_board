const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cleanFilePath } = require('../database/db');



const { BaseStorageService, getMimeType } = require('./baseStorageService');

class LocalStorageService extends BaseStorageService {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || config.uploadDir;
    this.rootDir = config.rootDir;
    this._ensureDirectories();
  }

  _ensureDirectories() {
    const resumeDir = path.join(this.baseDir, 'resume');
    const coverDir = path.join(this.baseDir, 'cover_letter');
    if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });
    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
  }

  resolveSafePath(inputPath) {
    let p = cleanFilePath(inputPath);
    if (!p || p.toUpperCase() === 'NA') return null;

    // Check if input is a Google Drive link
    if (isGoogleDriveLink(p)) {
      return p;
    }

    if (!path.isAbsolute(p)) {
      p = path.resolve(this.rootDir, p);
    } else {
      p = path.normalize(p);
    }

    if (!fs.existsSync(p)) {
      const rel = path.relative(this.rootDir, p);
      if (rel.startsWith('..') && !path.isAbsolute(rel)) {
        console.warn(`[Security Alert] Blocked potential path traversal: ${inputPath}`);
        return null;
      }
    }
    return p;
  }

  async saveFile({ buffer, originalName, type, appId }) {
    this._ensureDirectories();
    const isCover = type === 'cover_letter' || type === 'cover_letter_path';
    const subfolder = isCover ? 'cover_letter' : 'resume';
    const targetDir = path.join(this.baseDir, subfolder);

    const safeName = path.basename(originalName || (isCover ? 'cover_letter.docx' : 'resume.pdf'))
      .replace(/[^a-zA-Z0-9._ -]/g, '_');

    const dest = path.join(targetDir, safeName);
    await fs.promises.writeFile(dest, buffer);
    const stats = await fs.promises.stat(dest);
    const relPath = path.relative(this.rootDir, dest).replace(/\\/g, '/');

    return {
      fullPath: dest,
      relativePath: relPath,
      name: safeName,
      size: stats.size,
      ext: path.extname(safeName).toLowerCase()
    };
  }

  getFileInfo(filePath) {
    if (isGoogleDriveLink(filePath)) {
      const fileId = extractGoogleDriveFileId(filePath);
      return {
        exists: true,
        name: 'Google Drive Document',
        size: 0,
        ext: '.gdoc',
        isGoogleDrive: true,
        fileId,
        resolvedPath: filePath
      };
    }

    const p = this.resolveSafePath(filePath);
    if (!p || !fs.existsSync(p)) {
      return { exists: false, error: 'File not found', resolvedPath: p };
    }
    try {
      const st = fs.statSync(p);
      return {
        exists: true,
        name: path.basename(p),
        size: st.size,
        ext: path.extname(p).toLowerCase(),
        mtime: st.mtime,
        resolvedPath: p
      };
    } catch (e) {
      return { exists: false, error: String(e), resolvedPath: p };
    }
  }

  getFileStream(filePath) {
    const p = this.resolveSafePath(filePath);
    if (!p || !fs.existsSync(p)) {
      return { exists: false, error: 'File not found' };
    }
    const stats = fs.statSync(p);
    if (!stats.isFile()) {
      return { exists: false, error: 'Target is not a file' };
    }
    return {
      exists: true,
      stream: fs.createReadStream(p),
      mime: getMimeType(p),
      size: stats.size,
      filename: path.basename(p),
      resolvedPath: p
    };
  }

  async deleteFile(filePath) {
    const p = this.resolveSafePath(filePath);
    if (p && fs.existsSync(p)) {
      await fs.promises.unlink(p);
      return true;
    }
    return false;
  }
}

function isGoogleDriveLink(input) {
  if (!input || typeof input !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com/i.test(input) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(input);
}

function extractGoogleDriveFileId(input) {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/(?:\/d\/|id=|file\/d\/|gdrive:)([a-zA-Z0-9_-]{20,})/i);
  return match ? match[1] : null;
}

// Storage Provider Factory
const localService = new LocalStorageService();
let storageService = localService;

if (config.storageProvider === 'google_drive') {
  try {
    const GoogleDriveStorageService = require('./googleDriveStorageService');
    const driveService = new GoogleDriveStorageService();
    if (driveService.isConfigured()) {
      storageService = driveService;
      console.log('[Storage Service] Initialized Active Provider: Google Drive');
    } else {
      console.log('[Storage Service] Google Drive credentials not yet configured. Operating with Hybrid Local/Cloud Link parser.');
    }
  } catch (err) {
    console.warn('[Storage Service] Failed to load Google Drive adapter:', err.message);
  }
}

module.exports = {
  BaseStorageService,
  LocalStorageService,
  storageService,
  getMimeType,
  isGoogleDriveLink,
  extractGoogleDriveFileId
};
