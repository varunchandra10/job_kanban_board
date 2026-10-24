const path = require('path');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.resolve(rootDir, '.env') });

const isVercel = Boolean(process.env.VERCEL);
const isDesktop = process.env.APP_MODE === 'desktop' || Boolean(process.env.DESKTOP_MODE) || Boolean(process.env.TAURI_ENV_PLATFORM);

function getDesktopDataDir() {
  const baseAppData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.local', 'share')
  );
  return path.join(baseAppData, 'JobTracker');
}

function resolveStoragePaths() {
  if (isVercel) {
    const dataDir = '/tmp';
    const dbPath = path.join(dataDir, 'tracker.db');
    const uploadDir = path.join(dataDir, 'documents');
    const backupDir = path.join(dataDir, 'backups');
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    } catch (_) {}
    return { dataDir, dbPath, uploadDir, backupDir };
  }

  if (isDesktop) {
    const dataDir = getDesktopDataDir();
    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch (_) {}
    }
    const dbPath = path.join(dataDir, 'tracker.db');
    const uploadDir = path.join(dataDir, 'documents');
    const backupDir = path.join(dataDir, 'backups');

    if (!fs.existsSync(uploadDir)) {
      try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
    }
    if (!fs.existsSync(backupDir)) {
      try { fs.mkdirSync(backupDir, { recursive: true }); } catch (_) {}
    }

    // Seed database if not yet existing
    if (!fs.existsSync(dbPath)) {
      const candidates = [
        path.resolve(__dirname, '../database/tracker.template.db'),
        path.resolve(rootDir, 'tracker.db')
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          try {
            fs.copyFileSync(candidate, dbPath);
            console.log(`[Desktop SQLite] Seeded user database from ${path.basename(candidate)}`);
            break;
          } catch (e) {
            console.warn('[Desktop SQLite] Seeding note:', e.message);
          }
        }
      }
    }

    return { dataDir, dbPath, uploadDir, backupDir };
  }

  // Web Local Development Mode
  const dataDir = rootDir;
  const dbPath = path.resolve(rootDir, process.env.DB_PATH || 'tracker.db');
  const uploadDir = path.resolve(rootDir, process.env.UPLOAD_DIR || 'documents');
  const backupDir = path.resolve(rootDir, 'backups');

  if (!fs.existsSync(uploadDir)) {
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (_) {}
  }
  if (!fs.existsSync(backupDir)) {
    try { fs.mkdirSync(backupDir, { recursive: true }); } catch (_) {}
  }

  return { dataDir, dbPath, uploadDir, backupDir };
}

const storagePaths = resolveStoragePaths();

const rawStorageProvider = (process.env.STORAGE_PROVIDER || 'google_drive').toLowerCase().trim();
const normalizedStorageProvider = (rawStorageProvider === 'google-drive' || rawStorageProvider === 'google_drive')
  ? 'google_drive'
  : rawStorageProvider;

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || (isVercel ? 'production' : 'development'),
  isDesktop,
  isVercel,
  storageProvider: normalizedStorageProvider,
  googleDesktopClientId: (process.env.GOOGLE_DESKTOP_CLIENT_ID || '').trim(),
  googleDesktopClientSecret: (process.env.GOOGLE_DESKTOP_CLIENT_SECRET || '').trim(),
  googleDriveFolderId: (process.env.GOOGLE_DRIVE_FOLDER_ID || '1XvpikQzEKf2ggiolLcPYLeX_jWjL0_N_').trim(),
  googleServiceAccountKeyPath: path.resolve(rootDir, process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || 'google-service-account.json'),
  dataDir: storagePaths.dataDir,
  dbPath: storagePaths.dbPath,
  uploadDir: storagePaths.uploadDir,
  backupDir: storagePaths.backupDir,
  tursoDatabaseUrl: (process.env.TURSO_DATABASE_URL || process.env.TURSO_URL || process.env.STORAGE_URL || '').trim(),
  tursoAuthToken: (process.env.TURSO_AUTH_TOKEN || process.env.TURSO_DATABASE_AUTH_TOKEN || process.env.TURSO_TOKEN || process.env.STORAGE_AUTH_TOKEN || '').trim(),
  jwtSecret: process.env.JWT_SECRET || 'job-tracker-dev-secret-key-change-in-prod',
  frontendDir: path.resolve(rootDir, 'frontend'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  appPin: (process.env.APP_PIN || '').trim(),
  rootDir
};

module.exports = config;
