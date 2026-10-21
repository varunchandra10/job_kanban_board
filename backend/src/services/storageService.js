const fs = require('fs');
const path = require('path');
const config = require('../config');
const { cleanFilePath } = require('../database/db');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.doc': return 'application/msword';
    case '.txt': case '.log': return 'text/plain; charset=utf-8';
    case '.md': return 'text/markdown; charset=utf-8';
    case '.html': case '.htm': return 'text/html; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

class BaseStorageService {
  async saveFile({ buffer, originalName, type, appId }) {
    throw new Error('saveFile() must be implemented by storage provider');
  }
  getFileStream(filePath) {
    throw new Error('getFileStream() must be implemented by storage provider');
  }
  getFileInfo(filePath) {
    throw new Error('getFileInfo() must be implemented by storage provider');
  }
  async deleteFile(filePath) {
    throw new Error('deleteFile() must be implemented by storage provider');
  }
  resolveSafePath(inputPath) {
    throw new Error('resolveSafePath() must be implemented by storage provider');
  }
}

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

const storageService = new LocalStorageService();

module.exports = {
  BaseStorageService,
  LocalStorageService,
  storageService,
  getMimeType
};
