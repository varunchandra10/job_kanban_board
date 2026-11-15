process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const requestIdMiddleware = require('../src/middleware/requestId');
const errorHandler = require('../src/middleware/errorHandler');

async function runTests() {
  console.log('🧪 Starting Task 4.2 & 4.3 Correlation ID & Error Envelope Tests...\n');

  // -----------------------------------------------------------------
  // 1. Test Request ID Generation & Header Setting
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Request ID Generation (UUID) ---');
  let headerNameSet = null;
  let headerValSet = null;

  const mockReq1 = { headers: {} };
  const mockRes1 = {
    setHeader(name, val) {
      headerNameSet = name;
      headerValSet = val;
    }
  };

  requestIdMiddleware(mockReq1, mockRes1, () => {});

  assert.ok(mockReq1.id, 'req.id must be generated');
  assert.strictEqual(typeof mockReq1.id, 'string');
  assert.strictEqual(headerNameSet, 'X-Request-Id');
  assert.strictEqual(headerValSet, mockReq1.id, 'Header must match generated req.id');
  assert.strictEqual(typeof mockReq1.log, 'function', 'req.log helper must be attached');
  console.log('✅ Generated unique UUID correlation ID and attached X-Request-Id header');

  // -----------------------------------------------------------------
  // 2. Test Preserving Client / Reverse-Proxy X-Request-Id
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Inbound Correlation ID Preservation ---');
  const incomingCorrelationId = 'client-trace-abc-123-xyz';
  const mockReq2 = { headers: { 'x-request-id': incomingCorrelationId } };
  const mockRes2 = {
    setHeader(name, val) {
      headerValSet = val;
    }
  };

  requestIdMiddleware(mockReq2, mockRes2, () => {});
  assert.strictEqual(mockReq2.id, incomingCorrelationId, 'Must preserve inbound correlation ID');
  assert.strictEqual(headerValSet, incomingCorrelationId);
  console.log('✅ Preserved incoming reverse-proxy correlation ID');

  // -----------------------------------------------------------------
  // 3. Test Standardized Error Handler Envelope
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Standardized Error Response Envelope ---');
  let resStatus = null;
  let resJson = null;

  const mockRes3 = {
    status(s) { resStatus = s; return this; },
    json(d) { resJson = d; return this; },
    getHeader() { return 'uuid-9999-error'; }
  };

  // Test 500 Generic Error
  const err500 = new Error('Database connection timed out');
  errorHandler(err500, { id: 'uuid-9999-error' }, mockRes3, () => {});

  assert.strictEqual(resStatus, 500);
  assert.strictEqual(resJson.ok, 0);
  assert.strictEqual(resJson.error, 'Database connection timed out');
  assert.strictEqual(resJson.code, 'INTERNAL_SERVER_ERROR');
  assert.strictEqual(resJson.requestId, 'uuid-9999-error');
  console.log('✅ Standardized 500 error envelope: { ok: 0, error, code: INTERNAL_SERVER_ERROR, requestId }');

  // Test 400 Bad Request with Custom Code
  const errCustom = new Error('Invalid resume file size');
  errCustom.status = 400;
  errCustom.code = 'FILE_TOO_LARGE';

  errorHandler(errCustom, { id: 'uuid-400-custom' }, mockRes3, () => {});
  assert.strictEqual(resStatus, 400);
  assert.strictEqual(resJson.ok, 0);
  assert.strictEqual(resJson.error, 'Invalid resume file size');
  assert.strictEqual(resJson.code, 'FILE_TOO_LARGE');
  assert.strictEqual(resJson.requestId, 'uuid-400-custom');
  console.log('✅ Custom code preserved in 400 response envelope: code = FILE_TOO_LARGE');

  // Test Multer Upload Error Mapping
  const multerErr = new Error('Unexpected field');
  multerErr.name = 'MulterError';

  errorHandler(multerErr, { id: 'uuid-multer-123' }, mockRes3, () => {});
  assert.strictEqual(resStatus, 400);
  assert.strictEqual(resJson.code, 'FILE_UPLOAD_ERROR');
  console.log('✅ Multer error mapped cleanly to status 400 and code FILE_UPLOAD_ERROR');

  console.log('\n🎉 ALL TASK 4.2 & 4.3 CORRELATION ID & ERROR ENVELOPE TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

