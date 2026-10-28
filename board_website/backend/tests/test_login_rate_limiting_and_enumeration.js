process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode for unit testing
delete process.env.DISABLE_IP_RATE_LIMIT; // Ensure rate limiting is active

const assert = require('assert');
const path = require('path');
const crypto = require('crypto');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.TURSO_DATABASE_URL = '';

const { db } = require('../src/database/db');
const { loginLimiter } = require('../src/middleware/rateLimiter');
const emailService = require('../src/services/emailService');
const authController = require('../src/controllers/authController');

// Mock email dispatcher so sandboxed test doesn't try connecting to live Gmail SMTP
const sentEmails = [];
emailService.sendPasswordResetEmail = async (toEmail, code) => {
  sentEmails.push({ toEmail, code });
  return true;
};

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
  console.log('🧪 Starting Task 6.3 Login Rate Limiting & User Email Enumeration Defense Tests...\n');

  console.log('--- 1. Testing loginLimiter IP rate limiting (max 10 attempts allowed, 11th rejected) ---');
  const testIp = '198.51.100.' + (Math.floor(Math.random() * 200) + 1);

  let passedCount = 0;
  let blocked429Count = 0;

  for (let attempt = 1; attempt <= 12; attempt++) {
    let nextCalled = false;
    const req = {
      ip: testIp,
      headers: {},
      app: { get: () => false }, // trust proxy mock
      connection: { remoteAddress: testIp }
    };
    const res = mockRes();

    await loginLimiter(req, res, () => {
      nextCalled = true;
    });

    if (nextCalled) {
      passedCount++;
    } else if (res.statusCode === 429) {
      blocked429Count++;
    }
  }

  assert.strictEqual(passedCount, 10, `Expected 10 login requests allowed, got ${passedCount}`);
  assert.strictEqual(blocked429Count, 2, `Expected attempts 11 & 12 to be blocked with 429, got ${blocked429Count}`);
  console.log('✅ loginLimiter allowed 10 requests and blocked subsequent attempts with HTTP 429');

  console.log('\n--- 2. Testing user email enumeration prevention in forgotPassword ---');
  const unregisteredEmail = 'non_existent_account_' + Date.now() + '@example.com';
  const reqUnregistered = {
    body: { email: unregisteredEmail }
  };
  const resUnregistered = mockRes();

  await authController.forgotPassword(reqUnregistered, resUnregistered);

  assert.strictEqual(resUnregistered.statusCode, 200, 'Unregistered email must return HTTP 200');
  assert.strictEqual(resUnregistered.body.ok, 1, 'Expected ok: 1');
  assert.ok(
    resUnregistered.body.message.includes('If an account is associated with'),
    'Expected generic notification message'
  );

  // Verify that no reset token was created for the non-existent account
  const resetRow = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(unregisteredEmail);
  assert.strictEqual(resetRow, undefined, 'No reset code should be generated for unregistered user');
  console.log('✅ Unregistered email returned uniform success response without creating ghost reset records');

  console.log('\n--- 3. Testing forgotPassword with a registered user ---');
  const registeredEmail = 'registered_user_' + Date.now() + '@example.com';
  const registeredUserId = 'usr_' + crypto.randomBytes(6).toString('hex');

  try {
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(registeredUserId, registeredEmail, 'Test User', 'hash_test');

    const reqRegistered = {
      body: { email: registeredEmail }
    };
    const resRegistered = mockRes();

    await authController.forgotPassword(reqRegistered, resRegistered);

    assert.strictEqual(resRegistered.statusCode, 200, 'Registered email must return HTTP 200');
    assert.strictEqual(resRegistered.body.ok, 1);
    assert.strictEqual(
      resRegistered.body.message,
      resUnregistered.body.message.replace(unregisteredEmail, registeredEmail),
      'Response message must be completely identical between registered and unregistered emails'
    );

    // Verify reset record exists in database
    const validReset = db.prepare('SELECT * FROM password_resets WHERE email = ?').get(registeredEmail);
    assert.ok(validReset, 'Reset code must be recorded for registered user');
    assert.strictEqual(validReset.code.length, 6, 'Verification code must be 6 digits');
    console.log('✅ Registered user received exact same uniform response and reset code was stored in DB');

  } finally {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(registeredUserId);
      db.prepare('DELETE FROM password_resets WHERE email = ?').run(registeredEmail);
    } catch (_) {}
  }

  console.log('\n🎉 ALL TASK 6.3 LOGIN RATE LIMITING & ENUMERATION TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
