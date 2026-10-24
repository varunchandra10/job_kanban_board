const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { google } = require('googleapis');
const config = require('../config');
const { BaseStorageService, getMimeType } = require('./baseStorageService');

class GoogleDriveStorageService extends BaseStorageService {
  constructor(options = {}) {
    super();
    this.folderId = options.folderId || null;
    this.keyFilePath = options.keyFilePath || config.googleServiceAccountKeyPath;
    this.localFallback = options.localFallback || null;
    this.driveClient = null;
    this.authClient = null;
    this._initAuth();
  }

  _initAuth() {
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
          const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
          this.authClient = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'] });
          this.driveClient = google.drive({ version: 'v3', auth: this.authClient });
          return;
        } catch (_) {}
      }
      const keyPathCandidates = [
        this.keyFilePath,
        path.resolve(process.cwd(), 'google-service-account.json'),
        path.resolve(__dirname, '../../../google-service-account.json'),
        path.resolve(__dirname, '../../google-service-account.json'),
        path.resolve(__dirname, '../database/google-service-account.json'),
        path.resolve('/var/task/google-service-account.json'),
        path.resolve('/var/task/backend/google-service-account.json')
      ];
      const validKeyPath = keyPathCandidates.find(p => p && fs.existsSync(p));
      if (validKeyPath) {
        this.keyFilePath = validKeyPath;
        this.authClient = new google.auth.GoogleAuth({
          keyFile: this.keyFilePath,
          scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
        });
        this.driveClient = google.drive({ version: 'v3', auth: this.authClient });
        console.log('[Google Drive] Authenticated successfully with service account key');
      } else {
        console.warn(`[Google Drive] Service account key not found at ${this.keyFilePath}. Ready for local link parsing.`);
      }
    } catch (err) {
      console.warn('[Google Drive] Initialization warning:', err.message);
    }
  }

  isConfigured() {
    return !!(this.driveClient && this.folderId);
  }

  resolveSafePath(inputPath) {
    if (!inputPath) return null;
    const str = String(inputPath).trim();
    if (/drive\.google\.com|docs\.google\.com/i.test(str) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(str) || /^[a-zA-Z0-9_-]{25,}$/.test(str)) {
      return str;
    }
    if (this.localFallback) {
      return this.localFallback.resolveSafePath(inputPath);
    }
    return str;
  }

  async testConnection(customFolderId) {
    if (!this.driveClient) {
      throw new Error(`Google Service Account credentials file missing at ${this.keyFilePath}`);
    }
    const res = await this.driveClient.files.get({
      fileId: (customFolderId || this.folderId),
      fields: 'id, name, mimeType'
    });
    return { ok: 1, folderName: res.data.name, folderId: res.data.id };
  }

  async saveFile({ buffer, originalName, type, appId, folderId }) {
    let targetFolder = folderId || this.folderId;
    if (targetFolder && String(targetFolder).includes('folders/')) {
      const m = String(targetFolder).match(/folders\/([a-zA-Z0-9_-]+)/);
      if (m) targetFolder = m[1];
    }
    if (targetFolder) targetFolder = String(targetFolder).split('?')[0].trim();
    if (!targetFolder) {
      throw new Error('Google Drive folder not configured. Please connect your personal Google Drive folder in Career Profile.');
    }
    if (!this.driveClient) this._initAuth();
    if (!this.driveClient) {
      throw new Error('Google Drive service is not configured with credentials');
    }

    const safeName = path.basename(originalName || 'document.pdf').replace(/[^a-zA-Z0-9._ -]/g, '_');
    const mime = getMimeType(safeName);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata = {
      name: safeName,
      parents: targetFolder ? [targetFolder] : undefined
    };

    const media = {
      mimeType: mime,
      body: stream
    };

    let file;
    try {
      file = await this.driveClient.files.create({
        requestBody: fileMetadata,
        resource: fileMetadata,
        supportsAllDrives: true,
        media,
        fields: 'id, name, size, webViewLink, webContentLink, mimeType'
      });
    } catch (createErr) {
      if (this.localFallback && (createErr.message?.includes('quota') || createErr.message?.includes('Service Accounts do not have storage quota'))) {
        console.warn('[Google Drive] Service Account quota restricted on personal drive. Gracefully saving file locally.');
        const localSaved = await this.localFallback.saveFile({ buffer, originalName, type, appId });
        localSaved.quotaNotice = true;
        return localSaved;
      }
      throw createErr;
    }

    // Make file readable for anyone with the link so preview works seamlessly
    try {
      await this.driveClient.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        },
        supportsAllDrives: true

      });
    } catch (_) {}

    const webViewLink = file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`;

    return {
      fullPath: webViewLink,
      relativePath: webViewLink,
      name: file.data.name,
      size: parseInt(file.data.size || String(buffer.length), 10),
      ext: path.extname(safeName).toLowerCase(),
      fileId: file.data.id,
      webViewLink,
      webContentLink: file.data.webContentLink
    };
  }

  async getFileStream(fileIdOrUrl) {
    if (!fileIdOrUrl) return { exists: false, error: 'No path specified' };
    const str = String(fileIdOrUrl).trim();
    const isDrive = /drive\.google\.com|docs\.google\.com/i.test(str) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(str) || /^[a-zA-Z0-9_-]{25,}$/.test(str);
    if (!isDrive && this.localFallback) {
      return this.localFallback.getFileStream(fileIdOrUrl);
    }

    const fileId = GoogleDriveStorageService.extractFileId(fileIdOrUrl);
    if (!fileId) {
      if (this.localFallback) return this.localFallback.getFileStream(fileIdOrUrl);
      return { exists: false, error: 'Google Drive client not configured or invalid file ID' };
    }

    try {
      const meta = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType, size'
      });

      const response = await this.driveClient.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return {
        exists: true,
        stream: response.data,
        mime: meta.data.mimeType,
        size: parseInt(meta.data.size || '0', 10),
        filename: meta.data.name,
        resolvedPath: fileIdOrUrl
      };
    } catch (err) {
      if (this.localFallback) {
        const loc = this.localFallback.getFileStream(fileIdOrUrl);
        if (loc.exists) return loc;
      }
      return { exists: false, error: err.message };
    }
  }

  async getFileInfo(fileIdOrUrl) {
    if (!fileIdOrUrl) return { exists: false, error: 'No path specified' };
    const str = String(fileIdOrUrl).trim();
    const isDrive = /drive\.google\.com|docs\.google\.com/i.test(str) || /^gdrive:[a-zA-Z0-9_-]{20,}/i.test(str) || /^[a-zA-Z0-9_-]{25,}$/.test(str);
    if (!isDrive && this.localFallback) {
      return this.localFallback.getFileInfo(fileIdOrUrl);
    }

    const fileId = GoogleDriveStorageService.extractFileId(fileIdOrUrl);
    if (!fileId) {
      if (this.localFallback) return this.localFallback.getFileInfo(fileIdOrUrl);
      return { exists: false, error: 'Not a valid Google Drive file' };
    }

    if (this.driveClient) {
      try {
        const meta = await this.driveClient.files.get({
          fileId,
          fields: 'id, name, mimeType, size, modifiedTime, webViewLink'
        });
        return {
          exists: true,
          name: meta.data.name,
          size: parseInt(meta.data.size || '0', 10),
          ext: path.extname(meta.data.name).toLowerCase(),
          mtime: meta.data.modifiedTime,
          resolvedPath: meta.data.webViewLink || fileIdOrUrl,
          isGoogleDrive: true,
          fileId
        };
      } catch (err) {
        if (this.localFallback) {
          const loc = this.localFallback.getFileInfo(fileIdOrUrl);
          if (loc.exists) return loc;
        }
        return { exists: false, error: err.message, isGoogleDrive: true, fileId };
      }
    }

    // Offline / unauthenticated metadata fallback
    return {
      exists: true,
      name: 'Google Drive Document',
      size: 0,
      ext: '.gdoc',
      resolvedPath: fileIdOrUrl,
      isGoogleDrive: true,
      fileId
    };
  }

  async deleteFile(fileIdOrUrl) {
    const fileId = GoogleDriveStorageService.extractFileId(fileIdOrUrl);
    if (!this.driveClient || !fileId) return false;
    try {
      await this.driveClient.files.delete({ fileId });
      return true;
    } catch (err) {
      console.warn('[Google Drive] Delete file warning:', err.message);
      return false;
    }
  }

  static extractFileId(input) {
    if (!input || typeof input !== 'string') return null;
    const str = input.trim();
    if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) return str;
    const match = str.match(/(?:\/d\/|id=|file\/d\/)([a-zA-Z0-9_-]{25,})/i);
    return match ? match[1] : null;
  }
}

module.exports = GoogleDriveStorageService;
