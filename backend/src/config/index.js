const path = require('path');
const dotenv = require('dotenv');

// Root is 3 levels up from backend/src/config
const rootDir = path.resolve(__dirname, '../../../');

dotenv.config({ path: path.resolve(rootDir, '.env') });

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: path.resolve(rootDir, process.env.DB_PATH || 'tracker.db'),
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'documents'),
  frontendDir: path.resolve(rootDir, 'frontend'),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  appPin: (process.env.APP_PIN || '').trim(),
  rootDir
};

module.exports = config;
