process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode

const assert = require('assert');
const { db } = require('../src/database/db');
const { runMigrations } = require('../src/database/migrator');
const authController = require('../src/controllers/authController');
const { passwordResetLimiter } = require('../src/middleware/rateLimiter');

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting Task 2.2 Password Reset Lockout & Rate Limiting Tests...\n');

  // Ensure migrations are run so password_resets has `attempts` column
  runMigrations(db);

  // --- Test 1: Verify Schema has `attempts` column ---
  console.log('--- 1. Testing Schema attempts column ---');
  const cols = db.prepare('PRAGMA table_info(password_resets)').all().map(c => c.name);
  assert(cols.includes('attempts'), `Expected password_resets to have 'attempts' column. Columns: ${cols.join(', ')}`);
  console.log('✅ Schema contains attempts column');

  // Setup test user
  const ts = Date.now();
  const testEmail = `lockout_user_${ts}@example.com`;
  const initialPasswordHash = 'mock_initial_hash_123';
  db.prepare("INSERT INTO users(id, email, name, password_hash) VALUES(?, ?, ?, ?)").run(
    `user_${ts}`,
    testEmail,
    'Lockout Test User',
    initialPasswordHash
  );

  // --- Test 2: Attempt Counter & Progressive Lockout (5 failed attempts -> 429 Lockout & deletion) ---
  console.log('\n--- 2. Testing 5 failed attempts lockout ---');
  const validCode = '112233';
  const expiresAt = Date.now() + 15 * 60 * 1000;
  db.prepare('DELETE FROM password_resets WHERE email = ?').run(testEmail);
  db.prepare('INSERT INTO password_resets (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)').run(
    testEmail,
    validCode,
    expiresAt
  );

  // Attempt 1: wrong code
  let res1 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000001', newPassword: 'newPassword123' } }, res1);
  assert.strictEqual(res1.statusCode, 400, `Attempt 1 should return 400, got ${res1.statusCode}`);
  assert(res1.body.error.includes('4 attempts remaining'), `Expected 4 attempts remaining message, got: ${res1.body.error}`);
  let row1 = db.prepare('SELECT attempts FROM password_resets WHERE email = ?').get(testEmail);
  assert.strictEqual(row1.attempts, 1, `DB attempts should be 1, got ${row1?.attempts}`);

  // Attempt 2: wrong code
  let res2 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000002', newPassword: 'newPassword123' } }, res2);
  assert.strictEqual(res2.statusCode, 400);
  assert(res2.body.error.includes('3 attempts remaining'));
  let row2 = db.prepare('SELECT attempts FROM password_resets WHERE email = ?').get(testEmail);
  assert.strictEqual(row2.attempts, 2);

  // Attempt 3: wrong code
  let res3 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000003', newPassword: 'newPassword123' } }, res3);
  assert.strictEqual(res3.statusCode, 400);
  assert(res3.body.error.includes('2 attempts remaining'));
  let row3 = db.prepare('SELECT attempts FROM password_resets WHERE email = ?').get(testEmail);
  assert.strictEqual(row3.attempts, 3);

  // Attempt 4: wrong code
  let res4 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000004', newPassword: 'newPassword123' } }, res4);
  assert.strictEqual(res4.statusCode, 400);
  assert(res4.body.error.includes('1 attempt remaining'));
  let row4 = db.prepare('SELECT attempts FROM password_resets WHERE email = ?').get(testEmail);
  assert.strictEqual(row4.attempts, 4);

  // Attempt 5: 5th wrong code -> MUST LOCK OUT with 429 and delete record
  let res5 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000005', newPassword: 'newPassword123' } }, res5);
  assert.strictEqual(res5.statusCode, 429, `Attempt 5 should trigger lockout 429, got ${res5.statusCode}`);
  assert(res5.body.error.includes('Maximum verification attempts exceeded'), `Expected lockout message, got: ${res5.body.error}`);

  // Verify the record was permanently deleted from DB
  let rowAfterLockout = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(testEmail);
  assert(!rowAfterLockout, 'Password reset record must be completely deleted upon reaching 5 failed attempts');
  console.log('✅ 5 failed attempts correctly returns 429 and invalidates the reset record');

  // Attempt 6: Subsequent attempt after lockout -> Rejected (record no longer exists)
  let res6 = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: '000006', newPassword: 'newPassword123' } }, res6);
  assert.strictEqual(res6.statusCode, 400);
  assert(res6.body.error.includes('Invalid or expired verification request'));
  console.log('✅ Subsequent attempts after lockout are rejected');

  // --- Test 3: Successful Password Reset with Valid Code ---
  console.log('\n--- 3. Testing successful reset with valid code ---');
  const validCode2 = '556677';
  db.prepare('INSERT INTO password_resets (email, code, expires_at, attempts) VALUES (?, ?, ?, 2)').run(
    testEmail,
    validCode2,
    Date.now() + 15 * 60 * 1000
  );

  let resSuccess = mockRes();
  authController.resetPassword({ body: { email: testEmail, code: validCode2, newPassword: 'myNewStrongPass2026!' } }, resSuccess);
  assert.strictEqual(resSuccess.statusCode, 200, `Expected 200 on valid code, got ${resSuccess.statusCode}`);
  assert(resSuccess.body.token, 'Should return signed JWT auth token');

  // Verify password was changed in DB
  const updatedUser = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(testEmail);
  assert.notStrictEqual(updatedUser.password_hash, initialPasswordHash, 'Password hash in DB must be updated');

  // Verify reset record was purged
  const rowAfterSuccess = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(testEmail);
  assert(!rowAfterSuccess, 'Reset record must be cleaned up on success');
  console.log('✅ Successful password reset updates user password and clears reset token');

  // --- Test 4: Express Rate Limiter Middleware (max 5 requests per IP) ---
  console.log('\n--- 4. Testing express-rate-limit IP rate limiting ---');
  delete process.env.DISABLE_IP_RATE_LIMIT; // Ensure enabled
  const mockIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  let passedCount = 0;
  let blocked429Count = 0;

  for (let i = 1; i <= 6; i++) {
    let nextCalled = false;
    const req = {
      ip: mockIp,
      headers: {},
      app: { get: () => false },
      connection: { remoteAddress: mockIp }
    };
    const res = mockRes();

    await passwordResetLimiter(req, res, () => {
      nextCalled = true;
    });

    if (nextCalled) {
      passedCount++;
    } else if (res.statusCode === 429) {
      blocked429Count++;
      const msg = typeof res.body === 'object' ? JSON.stringify(res.body) : String(res.body);
      assert(msg.includes('Too many password reset requests'), `Expected rate limit error message, got: ${msg}`);
    }
  }

  assert.strictEqual(passedCount, 5, `Expected exactly 5 requests allowed per IP, got ${passedCount}`);
  assert.strictEqual(blocked429Count, 1, `Expected 6th request to be blocked with 429, got ${blocked429Count}`);
  console.log('✅ express-rate-limit allows 5 requests and blocks the 6th with 429');

  // Clean up test data
  db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
  db.prepare('DELETE FROM password_resets WHERE email = ?').run(testEmail);

  console.log('\n🎉 ALL TASK 2.2 PASSWORD RESET LOCKOUT & RATE LIMITING TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
