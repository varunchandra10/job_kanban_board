const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cleanFilePath } = require('../database/db');

const { BaseStorageService, getMimeType } = require('./baseStorageService');

function isPathInside(childPath, parentDir) {
  if (!childPath || !parentDir) return false;
  try {
    const normalizedChild = path.resolve(childPath).toLowerCase();
    const normalizedParent = path.resolve(parentDir).toLowerCase();
    if (normalizedChild === normalizedParent) return true;
    const rel = path.relative(normalizedParent, normalizedChild);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch (_) {
    return false;
  }
}

function isSystemPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return true;
  try {
    const p = path.resolve(targetPath);
    const parsed = path.parse(p);
    if (p.toLowerCase() === parsed.root.toLowerCase()) return true;

    if (process.platform === 'win32') {
      const winDir = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
      if (isPathInside(p, winDir)) return true;
      const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      if (isPathInside(p, progFiles)) return true;
      const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      if (isPathInside(p, progFilesX86)) return true;
    } else {
      const unixSys = ['/etc', '/bin', '/sbin', '/usr', '/var', '/root', '/proc', '/sys', '/dev'];
      for (const sys of unixSys) {
        if (p === sys || isPathInside(p, sys)) return true;
      }
    }
    return false;
  } catch (_) {
    return true;
  }
}

class LocalStorageService extends BaseStorageService {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || config.uploadDir;
    this.rootDir = config.rootDir || path.resolve(__dirname, '../../../../');
    this._ensureDirectories();
  }

  _ensureDirectories() {
    try {
      const resumesDir = path.join(this.baseDir, 'resumes');
      const resumeDir = path.join(this.baseDir, 'resume');
      const coverDir = path.join(this.baseDir, 'cover_letter');
      if (!fs.existsSync(resumesDir) && !fs.existsSync(resumeDir)) fs.mkdirSync(resumesDir, { recursive: true });
      if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
    } catch (e) {
      console.warn('[Storage Service] Directory creation failed:', e.message);
    }
  }

  getAllowedDirectories() {
    const allowed = [];
    if (this.baseDir) {
      const bDir = path.resolve(this.baseDir);
      if (!isSystemPath(bDir)) allowed.push(bDir);
    }
    if (config.uploadDir) {
      const uDir = path.resolve(config.uploadDir);
      if (!isSystemPath(uDir) && !allowed.includes(uDir)) allowed.push(uDir);
    }
    if (config.dataDir) {
      const docSub = path.resolve(config.dataDir, 'documents');
      if (!isSystemPath(docSub) && !allowed.includes(docSub)) allowed.push(docSub);
    }

    try {
      const { db } = require('../database/db');
      if (db && typeof db.prepare === 'function') {
        const rows = db.prepare("SELECT value FROM settings WHERE key = 'custom_storage_dir'").all();
        for (const row of rows) {
          if (row && row.value && typeof row.value === 'string' && row.value.trim()) {
            const trimmed = path.resolve(row.value.trim());
            if (!isSystemPath(trimmed) && fs.existsSync(trimmed) && !allowed.includes(trimmed)) {
              allowed.push(trimmed);
            }
          }
        }
      }
    } catch (_) {}

    return allowed;
  }

  isPathAllowed(targetPath) {
    if (!targetPath) return false;
    if (targetPath.indexOf('\0') !== -1) return false;
    const resolved = path.resolve(targetPath);
    if (isSystemPath(resolved)) return false;

    const allowedDirs = this.getAllowedDirectories();
    for (const dir of allowedDirs) {
      if (isPathInside(resolved, dir)) {
        return true;
      }
    }
    return false;
  }

  resolveSafePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') return null;
    if (inputPath.indexOf('\0') !== -1) return null;

    let p = cleanFilePath(inputPath);
    if (!p || p.toUpperCase() === 'NA') return null;

    // Check if input is a Google Drive link
    if (isGoogleDriveLink(p)) {
      return p;
    }

    const allowedDirs = this.getAllowedDirectories();
    const basename = path.basename(p);

    // If an absolute path was passed
    if (path.isAbsolute(p)) {
      const normalized = path.resolve(p);
      // Strictly allow ONLY if normalized path is within an allowed directory
      if (this.isPathAllowed(normalized) && fs.existsSync(normalized)) {
        return normalized;
      }

      // If an absolute path was submitted that isn't inside allowed directories,
      // check if a file with the identical basename exists safely inside allowed storage
      for (const dir of allowedDirs) {
        const subDirs = ['', 'resumes', 'resume', 'cover_letter', 'cover_letters'];
        for (const sub of subDirs) {
          const candidate = path.resolve(dir, sub, basename);
          if (this.isPathAllowed(candidate) && fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }

      console.warn(`[Security Alert] Blocked potential path traversal or unauthorized access: ${inputPath}`);
      return null;
    }

    // Relative path passed: check within allowed directories
    for (const dir of allowedDirs) {
      // 1. Direct path relative to allowed directory
      const directCandidate = path.resolve(dir, p);
      if (this.isPathAllowed(directCandidate) && fs.existsSync(directCandidate)) {
        return directCandidate;
      }

      // 2. Subdirectory search
      const subDirs = ['resumes', 'resume', 'cover_letter', 'cover_letters'];
      for (const sub of subDirs) {
        const candidate = path.resolve(dir, sub, basename);
        if (this.isPathAllowed(candidate) && fs.existsSync(candidate)) {
          return candidate;
        }
      }

      // 3. Root of allowed directory with basename
      const rootCandidate = path.resolve(dir, basename);
      if (this.isPathAllowed(rootCandidate) && fs.existsSync(rootCandidate)) {
        return rootCandidate;
      }
    }

    // If the file does not exist yet (e.g. for saving a new file with relative path)
    const defaultTarget = path.resolve(this.baseDir, p);
    if (this.isPathAllowed(defaultTarget)) {
      return defaultTarget;
    }

    console.warn(`[Security Alert] Blocked potential path traversal: ${inputPath}`);
    return null;
  }

  async saveFile({ buffer, originalName, type, appId }) {
    this._ensureDirectories();
    const isCover = type === 'cover_letter' || type === 'cover_letter_path';
    const subfolder = isCover ? 'cover_letter' : 'resume';
    const targetDir = path.join(this.baseDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      try { fs.mkdirSync(targetDir, { recursive: true }); } catch (_) {}
    }

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
    if (!p) {
      console.warn(`[Security Alert] Blocked delete request for unsafe path: ${filePath}`);
      return false;
    }

    if (!this.isPathAllowed(p)) {
      console.warn(`[Security Alert] Refusing to delete file outside allowed storage directories: ${p}`);
      return false;
    }

    // Protect system, code, and database files
    const lower = path.basename(p).toLowerCase();
    if (
      lower.endsWith('.db') ||
      lower.endsWith('.sqlite') ||
      lower.endsWith('.db-wal') ||
      lower.endsWith('.db-shm') ||
      lower.endsWith('.bak') ||
      lower.endsWith('.env') ||
      lower.endsWith('.js') ||
      lower.endsWith('.json') ||
      lower.endsWith('.ts')
    ) {
      console.warn(`[Security Alert] Refusing to delete protected system/code file: ${p}`);
      return false;
    }

    if (fs.existsSync(p)) {
      const stats = await fs.promises.stat(p);
      if (stats.isFile()) {
        await fs.promises.unlink(p);
        return true;
      }
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
    const driveService = new GoogleDriveStorageService({ localFallback: localService });
    if (driveService.driveClient || driveService.isConfigured()) {
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
  localService,
  storageService,
  getMimeType,
  isGoogleDriveLink,
  extractGoogleDriveFileId
};
