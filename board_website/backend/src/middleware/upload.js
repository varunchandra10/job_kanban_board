const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
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

/**
 * Hybrid storage engine:
 * - Files <= threshold (default 2MB) are held in memory as Buffer (req.file.buffer).
 * - Files > threshold are streamed directly to temporary scratch space in os.tmpdir() (req.file.path).
 * Memory references are immediately released upon exceeding threshold.
 */
class HybridStorageEngine {
  constructor(options = {}) {
    this.threshold = options.threshold || 2 * 1024 * 1024; // 2MB
    this.tempDir = options.tempDir || path.join(os.tmpdir(), 'job-tracker-uploads');
    if (!fs.existsSync(this.tempDir)) {
      try { fs.mkdirSync(this.tempDir, { recursive: true }); } catch (_) {}
    }
  }

  _handleFile(req, file, cb) {
    const chunks = [];
    let bytesReceived = 0;
    let diskWriteStream = null;
    let tempFilePath = null;
    let isSpilledToDisk = false;

    file.stream.on('data', (chunk) => {
      bytesReceived += chunk.length;

      if (!isSpilledToDisk) {
        if (bytesReceived <= this.threshold) {
          chunks.push(chunk);
        } else {
          // Spill to disk scratch space
          isSpilledToDisk = true;
          const tempName = `upload-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname || '')}`;
          tempFilePath = path.join(this.tempDir, tempName);
          diskWriteStream = fs.createWriteStream(tempFilePath);

          // Flush pre-buffered chunks into the disk stream and release memory
          for (const prevChunk of chunks) {
            diskWriteStream.write(prevChunk);
          }
          chunks.length = 0;

          diskWriteStream.write(chunk);
        }
      } else {
        diskWriteStream.write(chunk);
      }
    });

    file.stream.on('end', () => {
      if (isSpilledToDisk && diskWriteStream) {
        diskWriteStream.end(() => {
          cb(null, {
            size: bytesReceived,
            path: tempFilePath,
            isDisk: true,
            originalname: file.originalname,
            mimetype: file.mimetype
          });
        });
      } else {
        const buffer = Buffer.concat(chunks, bytesReceived);
        cb(null, {
          size: bytesReceived,
          buffer,
          isDisk: false,
          originalname: file.originalname,
          mimetype: file.mimetype
        });
      }
    });

    file.stream.on('error', (err) => {
      if (diskWriteStream) {
        diskWriteStream.destroy();
        try { if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (_) {}
      }
      cb(err);
    });
  }

  _removeFile(req, file, cb) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, cb);
    } else {
      cb(null);
    }
  }
}

const hybridStorage = new HybridStorageEngine({
  threshold: 2 * 1024 * 1024 // 2MB
});

const upload = multer({
  storage: hybridStorage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024
  },
  fileFilter
});

upload.HybridStorageEngine = HybridStorageEngine;

module.exports = upload;
