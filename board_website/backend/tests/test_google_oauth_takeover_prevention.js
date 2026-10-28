process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode for unit testing

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.TURSO_DATABASE_URL = ''; // Ensure Turso is disabled for sandboxed testing

const { db } = require('../src/database/db');
const authController = require('../src/controllers/authController');

async function runTests() {
  console.log('🧪 Starting Task 6.1 Google OAuth Account Takeover Prevention Tests...\n');

  // Test setup: clean up test users
  const googleUserEmail = 'google_user_test_' + Date.now() + '@example.com';
  const normalUserEmail = 'password_user_test_' + Date.now() + '@example.com';
  const googleUserId = 'usr_g_' + crypto.randomBytes(6).toString('hex');
  const normalUserId = 'usr_p_' + crypto.randomBytes(6).toString('hex');

  try {
    // 1. Simulate Google OAuth user registration (password_hash is null/empty)
    db.prepare(`
      INSERT INTO users (id, email, name, avatar_url, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run(googleUserId, googleUserEmail, 'Google Test User', '', null);

    console.log('--- 1. Testing that Google OAuth user cannot be taken over via login with arbitrary password ---');
    let resStatus = null;
    let resJson = null;

    const fakeReqWithPass = {
      body: {
        email: googleUserEmail,
        password: 'attacker_password_123'
      }
    };
    const fakeResWithPass = {
      status(s) {
        resStatus = s;
        return this;
      },
      json(d) {
        resJson = d;
        return this;
      }
    };

    authController.login(fakeReqWithPass, fakeResWithPass);

    assert.strictEqual(resStatus, 403, `Expected HTTP 403 Forbidden, got ${resStatus}`);
    assert.strictEqual(resJson.requiresGoogleAuth, true, 'Expected requiresGoogleAuth to be true');
    assert.strictEqual(resJson.token, undefined, 'No token should be issued');

    // Verify database password_hash was NOT overwritten
    const checkUser = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(googleUserId);
    assert.strictEqual(checkUser.password_hash, null, 'User password_hash must remain null');
    console.log('✅ Google OAuth account cannot be hijacked with arbitrary password (rejected with 403)');

    console.log('\n--- 2. Testing that Google OAuth user cannot be logged into with empty password ---');
    resStatus = null;
    resJson = null;

    const fakeReqNoPass = {
      body: {
        email: googleUserEmail,
        password: ''
      }
    };
    const fakeResNoPass = {
      status(s) {
        resStatus = s;
        return this;
      },
      json(d) {
        resJson = d;
        return this;
      }
    };

    authController.login(fakeReqNoPass, fakeResNoPass);

    assert.strictEqual(resStatus, 403, `Expected HTTP 403 Forbidden, got ${resStatus}`);
    assert.strictEqual(resJson.requiresGoogleAuth, true, 'Expected requiresGoogleAuth to be true');
    assert.strictEqual(resJson.token, undefined, 'No token should be issued');
    console.log('✅ Google OAuth account cannot be bypassed with empty password (rejected with 403)');

    console.log('\n--- 3. Testing direct email + password registration and authentication ---');
    // Register normal user
    resStatus = null;
    resJson = null;
    const fakeReqRegister = {
      body: {
        email: normalUserEmail,
        name: 'Normal User',
        password: 'secure_password_999'
      }
    };
    const fakeResRegister = {
      status(s) {
        resStatus = s;
        return this;
      },
      json(d) {
        resJson = d;
        return this;
      }
    };

    authController.login(fakeReqRegister, fakeResRegister);
    assert.ok(resJson.token, 'Expected token issued on successful registration');
    assert.strictEqual(resJson.ok, 1);

    // Test failed password attempt
    resStatus = null;
    resJson = null;
    authController.login(
      { body: { email: normalUserEmail, password: 'wrong_password' } },
      { status(s) { resStatus = s; return this; }, json(d) { resJson = d; return this; } }
    );
    assert.strictEqual(resStatus, 401, `Expected 401 Unauthorized on wrong password, got ${resStatus}`);

    // Test correct password attempt
    resStatus = null;
    resJson = null;
    authController.login(
      { body: { email: normalUserEmail, password: 'secure_password_999' } },
      { status(s) { resStatus = s; return this; }, json(d) { resJson = d; return this; } }
    );
    assert.ok(resJson.token, 'Expected token issued on correct password');
    console.log('✅ Standard email/password accounts authenticate correctly with password validation');

    console.log('\n🎉 ALL TASK 6.1 GOOGLE OAUTH ACCOUNT TAKEOVER TESTS PASSED!');
  } finally {
    // Cleanup
    try {
      db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(googleUserEmail, normalUserEmail);
    } catch (_) {}
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
