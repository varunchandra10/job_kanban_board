const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.resolve(rootDir, '.env') });

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase().trim(),
  googleDriveFolderId: (process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim(),
  googleServiceAccountKeyPath: path.resolve(rootDir, process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || 'google-service-account.json'),
  dbPath: path.resolve(rootDir, process.env.DB_PATH || 'tracker.db'),
  tursoDatabaseUrl: (process.env.TURSO_DATABASE_URL || '').trim(),
  tursoAuthToken: (process.env.TURSO_AUTH_TOKEN || '').trim(),
  jwtSecret: process.env.JWT_SECRET || 'job-tracker-dev-secret-key-change-in-prod',
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'documents'),
  frontendDir: path.resolve(rootDir, 'frontend'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  appPin: (process.env.APP_PIN || '').trim(),
  rootDir
};

module.exports = config;
