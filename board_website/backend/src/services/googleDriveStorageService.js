const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { google } = require('googleapis');
const config = require('../config');
const { BaseStorageService, getMimeType } = require('./baseStorageService');

class GoogleDriveStorageService extends BaseStorageService {
  constructor(options = {}) {
    super();
    this.folderId = options.folderId || config.googleDriveFolderId || '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_';
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
        path.resolve(__dirname, '../../../../google-service-account.json'),
        path.resolve(__dirname, '../../../google-service-account.json'),
        path.resolve(__dirname, '../../google-service-account.json'),
        path.resolve(__dirname, '../database/google-service-account.json'),
        path.resolve('/var/task/google-service-account.json'),
        path.resolve('/var/task/board_website/backend/google-service-account.json'),
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
      this._initAuth();
    }
    if (!this.driveClient) {
      throw new Error(`Google Service Account credentials file is missing or invalid. Looked for key file at: ${this.keyFilePath}. Please place google-service-account.json in the project root or configure GOOGLE_SERVICE_ACCOUNT_JSON.`);
    }

    let targetFolder = (customFolderId || this.folderId);
    if (targetFolder && String(targetFolder).includes('folders/')) {
      const m = String(targetFolder).match(/folders\/([a-zA-Z0-9_-]+)/);
      if (m) targetFolder = m[1];
    }
    if (targetFolder) targetFolder = String(targetFolder).split('?')[0].trim();

    if (!targetFolder) {
      throw new Error('No Google Drive folder ID provided to test.');
    }

    try {
      const res = await this.driveClient.files.get({
        fileId: targetFolder,
        fields: 'id, name, mimeType, trashed, capabilities'
      });
      if (res.data.trashed) {
        throw new Error(`The specified folder "${res.data.name}" (ID: ${targetFolder}) is currently in the Google Drive trash.`);
      }
      return {
        ok: 1,
        folderName: res.data.name || 'JobTracker_Documents',
        folderId: res.data.id
      };
    } catch (apiErr) {
      const status = apiErr.status || apiErr.code || (apiErr.response && apiErr.response.status);
      let serviceEmail = '';
      try {
        if (this.authClient && typeof this.authClient.getCredentials === 'function') {
          const creds = await this.authClient.getCredentials();
          serviceEmail = creds.client_email || '';
        }
      } catch (_) {}

      if (status === 404) {
        const emailMsg = serviceEmail ? ` with service account "${serviceEmail}"` : ' with your Google Service Account email';
        throw new Error(`Folder not found or not shared. Please ensure folder ID "${targetFolder}" exists and has been shared${emailMsg} with "Editor" access.`);
      } else if (status === 403) {
        throw new Error(`Permission denied for folder "${targetFolder}". Please verify Google Drive API is enabled in your Google Cloud Console and the service account has "Editor" permission.`);
      } else if (status === 401) {
        throw new Error('Service account authentication failed (401). Please verify that your service account credentials are valid and not expired or disabled.');
      }
      throw new Error(apiErr.message || 'Unknown error communicating with Google Drive');
    }
  }

  getClient(userAccessToken) {
    if (userAccessToken) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: userAccessToken });
      return google.drive({ version: 'v3', auth: oauth2Client });
    }
    if (!this.driveClient) this._initAuth();
    return this.driveClient;
  }

  async ensureAppRootFolder(drive) {
    try {
      const q = `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and (name = 'job_kanban_board' or name = 'JobKanbanBoard') and trashed = false`;
      const res = await drive.files.list({ q, fields: 'files(id, name)', pageSize: 1 });
      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
      }
      const created = await drive.files.create({
        requestBody: {
          name: 'job_kanban_board',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root']
        },
        fields: 'id, name'
      });
      return created.data.id;
    } catch (err) {
      console.warn('[Google Drive] Note getting/creating root job_kanban_board:', err.message);
      return 'root';
    }
  }

  async getOrCreateSubfolder(parentFolderId, folderType, client = null) {
    const drive = client || this.driveClient;
    if (!drive) {
      if (!this.driveClient) this._initAuth();
    }
    const activeDrive = client || this.driveClient;
    if (!activeDrive) {
      throw new Error('Google Drive service is not authenticated');
    }

    const isCover = folderType === 'cover_letter' || folderType === 'cover_letters' || folderType === 'cover' || folderType === 'cover_letter_path';
    const primaryName = isCover ? 'cover_letters' : 'resumes';
    const candidateNames = isCover
      ? ['cover_letters', 'cover_letter', 'Cover Letters', 'Cover Letter']
      : ['resumes', 'resume', 'Resumes', 'Resume'];

    // 1. Search for existing folder with any matching candidate names
    for (const name of candidateNames) {
      try {
        const q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`;
        const searchRes = await activeDrive.files.list({
          q,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageSize: 1
        });

        if (searchRes.data.files && searchRes.data.files.length > 0) {
          return searchRes.data.files[0].id;
        }
      } catch (err) {
        console.warn(`[Google Drive] Note searching for subfolder ${name}:`, err.message);
      }
    }

    // 2. Not found, create the primary subfolder
    try {
      const folderMetadata = {
        name: primaryName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      };
      const createRes = await activeDrive.files.create({
        requestBody: folderMetadata,
        supportsAllDrives: true,
        fields: 'id, name'
      });
      console.log(`[Google Drive] Created subfolder "${primaryName}" (${createRes.data.id}) in parent ${parentFolderId}`);
      return createRes.data.id;
    } catch (createErr) {
      console.warn(`[Google Drive] Could not create subfolder ${primaryName}:`, createErr.message);
      return parentFolderId;
    }
  }

  async saveFile({ buffer, originalName, type, appId, folderId, userAccessToken }) {
    let targetFolder = folderId || this.folderId;
    if (targetFolder && String(targetFolder).includes('folders/')) {
      const m = String(targetFolder).match(/folders\/([a-zA-Z0-9_-]+)/);
      if (m) targetFolder = m[1];
    }
    if (targetFolder) targetFolder = String(targetFolder).split('?')[0].trim();

    const drive = this.getClient(userAccessToken);
    if (!drive) {
      throw new Error('Google Drive service is not configured with credentials');
    }

    if (userAccessToken) {
      let isAccessible = false;
      if (targetFolder) {
        try {
          await drive.files.get({ fileId: targetFolder, fields: 'id' });
          isAccessible = true;
        } catch (_) {
          isAccessible = false;
        }
      }
      if (!isAccessible) {
        targetFolder = await this.ensureAppRootFolder(drive);
      }
    }

    if (!targetFolder) {
      throw new Error('Google Drive folder not configured. Please connect your Google Drive.');
    }

    // Resolve or auto-create subfolder (resumes in resumes folder, cover_letters in cover_letters folder)
    const uploadFolderId = await this.getOrCreateSubfolder(targetFolder, type, drive);

    const isCover = type === 'cover_letter' || type === 'cover_letters' || type === 'cover' || type === 'cover_letter_path';
    const safeName = path.basename(originalName || (isCover ? 'cover_letter.pdf' : 'resume.pdf')).replace(/[^a-zA-Z0-9._ -]/g, '_');
    const mime = getMimeType(safeName);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata = {
      name: safeName,
      parents: [uploadFolderId]
    };

    const media = {
      mimeType: mime,
      body: stream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      resource: fileMetadata,
      supportsAllDrives: true,
      media,
      fields: 'id, name, size, webViewLink, webContentLink, mimeType'
    });

    // Make file readable for anyone with the link so preview works seamlessly
    try {
      await drive.permissions.create({
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
      path: webViewLink,
      name: file.data.name,
      size: parseInt(file.data.size || String(buffer.length), 10),
      ext: path.extname(safeName).toLowerCase(),
      fileId: file.data.id,
      webViewLink,
      webContentLink: file.data.webContentLink,
      isGoogleDrive: true,
      folderId: uploadFolderId
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
