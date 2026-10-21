const multer = require('multer');
const path = require('path');
const config = require('../config');

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.png', '.jpg', '.jpeg', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed (${ext}). Allowed: ${ALLOWED_EXTS.join(', ')}`), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024
  },
  fileFilter
});

module.exports = upload;
