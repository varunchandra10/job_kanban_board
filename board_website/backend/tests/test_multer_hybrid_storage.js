process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Readable } = require('stream');
const upload = require('../src/middleware/upload');
const documentsController = require('../src/controllers/documentsController');
const { db } = require('../src/database/db');

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting Task 3.2 Multer Memory Storage Optimization Tests...\n');

  const HybridStorageEngine = upload.HybridStorageEngine;
  assert(HybridStorageEngine, 'HybridStorageEngine should be exported from upload middleware');

  const customEngine = new HybridStorageEngine({
    threshold: 512 * 1024 // 512KB threshold for quick testing
  });

  // --- Test 1: Small file (<= threshold) held in memory buffer ---
  console.log('--- 1. Testing small file (< threshold) memory buffering ---');
  const smallSize = 100 * 1024; // 100KB
  const smallBuffer = Buffer.alloc(smallSize, 0x41); // 'A'
  const smallStream = new Readable();
  smallStream.push(smallBuffer);
  smallStream.push(null);

  const mockSmallFile = {
    stream: smallStream,
    originalname: 'small_resume.pdf',
    mimetype: 'application/pdf'
  };

  const smallResult = await new Promise((resolve, reject) => {
    customEngine._handleFile({}, mockSmallFile, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });

  assert.strictEqual(smallResult.isDisk, false, 'Small file should not spill to disk');
  assert(Buffer.isBuffer(smallResult.buffer), 'Small file must have memory buffer');
  assert.strictEqual(smallResult.buffer.length, smallSize);
  assert(!smallResult.path, 'Small file should not have disk path');
  console.log('✅ Small file preserved in memory buffer');

  // --- Test 2: Large file (> threshold) spilled over to disk scratch space ---
  console.log('\n--- 2. Testing large file (> threshold) spillover to disk ---');
  const largeSize = 2 * 1024 * 1024; // 2MB (> 512KB threshold)
  const largeStream = new Readable({
    read() {
      // Stream chunks of 64KB
      if (this.sentBytes === undefined) this.sentBytes = 0;
      const chunkSize = 64 * 1024;
      if (this.sentBytes < largeSize) {
        const remaining = largeSize - this.sentBytes;
        const toSend = Math.min(chunkSize, remaining);
        this.push(Buffer.alloc(toSend, 0x42)); // 'B'
        this.sentBytes += toSend;
      } else {
        this.push(null);
      }
    }
  });

  const mockLargeFile = {
    stream: largeStream,
    originalname: 'large_portfolio.pdf',
    mimetype: 'application/pdf'
  };

  const largeResult = await new Promise((resolve, reject) => {
    customEngine._handleFile({}, mockLargeFile, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });

  assert.strictEqual(largeResult.isDisk, true, 'Large file must spill to disk');
  assert.strictEqual(largeResult.buffer, undefined, 'Large file memory buffer must be released');
  assert(largeResult.path, 'Large file must have a disk path');
  assert(fs.existsSync(largeResult.path), `Spilled file must exist on disk at ${largeResult.path}`);
  assert.strictEqual(fs.statSync(largeResult.path).size, largeSize, 'Spilled file size on disk must match transmitted size');
  console.log(`✅ Large file (${(largeSize / 1024 / 1024).toFixed(1)}MB) spilled cleanly to scratch disk: ${largeResult.path}`);

  // Clean up test file
  fs.unlinkSync(largeResult.path);

  // --- Test 3: Controller uploadDocument cleans up temp file in finally block ---
  console.log('\n--- 3. Testing controller temp file cleanup in finally block ---');
  const tempDir = path.join(os.tmpdir(), 'job-tracker-uploads');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempFilePath = path.join(tempDir, `test-cleanup-${Date.now()}.pdf`);
  fs.writeFileSync(tempFilePath, Buffer.alloc(1024 * 1024, 0x43)); // 1MB temp scratch file
  assert(fs.existsSync(tempFilePath), 'Test scratch file should exist prior to controller call');

  const testUserId = `test_upload_user_${Date.now()}`;
  const mockReqUpload = {
    user: { id: testUserId },
    file: {
      path: tempFilePath,
      originalname: 'test_upload_doc.pdf',
      mimetype: 'application/pdf'
    },
    body: {
      type: 'resume',
      storageMode: 'local'
    },
    headers: {}
  };

  const resUpload = mockRes();
  await documentsController.uploadDocument(mockReqUpload, resUpload, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(resUpload.statusCode, 200, `Expected 200, got ${resUpload.statusCode}: ${JSON.stringify(resUpload.body)}`);
  assert(resUpload.body.ok === 1, 'Upload should succeed');

  // THE KEY TEST: Verify temp scratch file was cleaned up by the finally block
  assert(!fs.existsSync(tempFilePath), 'CRITICAL: Temporary scratch file MUST be deleted in finally block after processing!');
  console.log('✅ Temporary scratch file was safely deleted in finally block after successful upload');

  // --- Test 4: Cleanup on upload error ---
  console.log('\n--- 4. Testing temp file cleanup on error ---');
  const tempFileErrorPath = path.join(tempDir, `test-error-cleanup-${Date.now()}.pdf`);
  fs.writeFileSync(tempFileErrorPath, Buffer.from('dummy-data'));
  assert(fs.existsSync(tempFileErrorPath));

  const mockReqError = {
    user: { id: testUserId },
    file: {
      path: tempFileErrorPath,
      originalname: 'error_doc.pdf'
    },
    body: {
      storageMode: 'invalid_drive_mode_trigger_error'
    },
    headers: {}
  };

  const resError = mockRes();
  await documentsController.uploadDocument(mockReqError, resError, () => {});

  // Scratch file must be deleted even if error occurs
  assert(!fs.existsSync(tempFileErrorPath), 'Temporary scratch file MUST be deleted in finally block even on error!');
  console.log('✅ Temporary scratch file was safely deleted in finally block on error');

  // Clean up DB records created by test
  db.prepare('DELETE FROM document_files WHERE user_id = ?').run(testUserId);

  console.log('\n🎉 ALL TASK 3.2 MULTER MEMORY OPTIMIZATION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

