const path = require('path');

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

module.exports = {
  BaseStorageService,
  getMimeType
};
