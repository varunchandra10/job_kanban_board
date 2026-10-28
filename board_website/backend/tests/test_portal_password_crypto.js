process.env.TURSO_DATABASE_URL = ''; // Force local SQLite

const assert = require('assert');
const { encryptCredential, decryptCredential, migratePlaintextCredentials } = require('../src/services/cryptoService');
const { db, getState, patch } = require('../src/database/db');
const applicationsController = require('../src/controllers/applicationsController');

async function runTests() {
  console.log('🧪 Starting Task 2.1 Portal Password Symmetric AES-256-GCM Encryption Tests...');

  // --- Test 1: Unit Tests for cryptoService ---
  console.log('\n--- 1. Testing cryptoService encrypt/decrypt primitives ---');
  const plain = 'SuperSecretP@ssw0rd!2026#';
  const cipher = encryptCredential(plain);
  assert(cipher.startsWith('enc:v1:'), `Expected cipher to start with enc:v1:, got: ${cipher}`);
  assert(!cipher.includes(plain), 'Cipher must not contain plaintext');

  const decrypted = decryptCredential(cipher);
  assert.strictEqual(decrypted, plain, `Decrypted text should match original: ${decrypted} vs ${plain}`);

  // Idempotence
  const cipherAgain = encryptCredential(cipher);
  assert.strictEqual(cipherAgain, cipher, 'Encrypting an already encrypted string should return it unchanged');

  // Backward compatibility with legacy plaintext
  const legacyPlain = 'legacy_plaintext_pw';
  assert.strictEqual(decryptCredential(legacyPlain), legacyPlain, 'Legacy plaintext should be returned as-is');

  // Empty / null inputs
  assert.strictEqual(encryptCredential(''), '');
  assert.strictEqual(encryptCredential(null), '');
  assert.strictEqual(decryptCredential(''), '');
  assert.strictEqual(decryptCredential(null), '');

  // Tamper resistance (corrupted auth tag or ciphertext)
  const parts = cipher.split(':');
  parts[4] = 'ff' + parts[4].slice(2); // flip bits in ciphertext
  const tampered = parts.join(':');
  const tamperResult = decryptCredential(tampered);
  assert.strictEqual(tamperResult, '', 'Tampered ciphertext should fail authentication and return empty string');
  console.log('✅ Unit tests passed');

  // --- Test 2: Application creation with encrypted storage in SQLite ---
  console.log('\n--- 2. Testing Application creation & SQLite ciphertext storage ---');
  const testUserId = `test_crypto_user_${Date.now()}`;
  const testPassword = 'MySecretPortalPassword!789';

  let createdResponse = null;
  const mockReqCreate = {
    user: { id: testUserId, email: `${testUserId}@example.com` },
    body: {
      company: 'CryptoTestCorp',
      role: 'Security Engineer',
      portal_url: 'https://careers.cryptotestcorp.com',
      portal_user: 'cryptouser',
      portal_pass: testPassword
    }
  };
  const mockResCreate = {
    status(code) {
      assert.strictEqual(code, 201, `Expected status 201, got ${code}`);
      return this;
    },
    json(data) {
      createdResponse = data;
      return this;
    }
  };

  applicationsController.createApplication(mockReqCreate, mockResCreate, (err) => {
    if (err) throw err;
  });

  assert(createdResponse && createdResponse.id, 'Expected application to be created');
  const appId = createdResponse.id;

  // Verify created response sent back to the owner has the decrypted plaintext password
  assert.strictEqual(createdResponse.portal_pass, testPassword, 'Response to caller should contain decrypted password');

  // Verify physical SQLite column stores ciphertext, NEVER plaintext
  const dbRow = db.prepare('SELECT portal_pass FROM applications WHERE id = ?').get(appId);
  assert(dbRow && dbRow.portal_pass, 'Database row must exist with portal_pass');
  assert(dbRow.portal_pass.startsWith('enc:v1:'), `SQLite portal_pass column must be encrypted! Found: ${dbRow.portal_pass}`);
  assert(!dbRow.portal_pass.includes(testPassword), 'SQLite column must NEVER contain plaintext password');
  console.log('✅ SQLite stores AES-256-GCM ciphertext and controller returns decrypted string to caller');

  // --- Test 3: getState() returns decrypted password ---
  console.log('\n--- 3. Testing getState() decryption for authenticated user ---');
  const state = getState(testUserId);
  const foundApp = state.apps.find(a => a.id === appId);
  assert(foundApp, 'Application should be returned in getState');
  assert.strictEqual(foundApp.portal_pass, testPassword, 'getState must return decrypted password');
  console.log('✅ getState() correctly serves decrypted password');

  // --- Test 4: updateApplication() / patch() encrypts new passwords ---
  console.log('\n--- 4. Testing updateApplication / patch encryption ---');
  const updatedPassword = 'NewUpdatedPortalPassword@2027';
  const mockReqUpdate = {
    user: { id: testUserId },
    params: { id: String(appId) },
    body: { portal_pass: updatedPassword }
  };
  let updateOk = false;
  const mockResUpdate = {
    json(data) {
      if (data && data.ok) updateOk = true;
      return this;
    }
  };

  applicationsController.updateApplication(mockReqUpdate, mockResUpdate, (err) => {
    if (err) throw err;
  });

  assert(updateOk, 'Expected updateApplication to return ok: 1');

  // Check physical SQLite column again
  const dbRowUpdated = db.prepare('SELECT portal_pass FROM applications WHERE id = ?').get(appId);
  assert(dbRowUpdated.portal_pass.startsWith('enc:v1:'), 'Updated password in SQLite must start with enc:v1:');
  assert(!dbRowUpdated.portal_pass.includes(updatedPassword), 'Updated SQLite column must not contain plaintext password');

  // Verify getState returns the updated plaintext
  const stateUpdated = getState(testUserId);
  const foundAppUpdated = stateUpdated.apps.find(a => a.id === appId);
  assert.strictEqual(foundAppUpdated.portal_pass, updatedPassword, 'getState must return newly updated decrypted password');
  console.log('✅ updateApplication / patch encrypts on update');

  // --- Test 5: Legacy plaintext migration ---
  console.log('\n--- 5. Testing automatic migration of legacy unencrypted rows ---');
  const legacyPass = 'legacy_unencrypted_secret_123';
  const legacyAppInsert = db.prepare("INSERT INTO applications(company, role, portal_pass, user_id) VALUES('LegacyCorp', 'Dev', ?, ?)").run(legacyPass, testUserId);
  const legacyAppId = Number(legacyAppInsert.lastInsertRowid);

  // Before migration: verify row has raw plaintext
  const rowBefore = db.prepare('SELECT portal_pass FROM applications WHERE id = ?').get(legacyAppId);
  assert.strictEqual(rowBefore.portal_pass, legacyPass, 'Legacy row should initially have raw plaintext');

  // Run migration
  migratePlaintextCredentials(db);

  // After migration: verify row has been encrypted to enc:v1:...
  const rowAfter = db.prepare('SELECT portal_pass FROM applications WHERE id = ?').get(legacyAppId);
  assert(rowAfter.portal_pass.startsWith('enc:v1:'), 'Legacy row must now be encrypted with enc:v1:');
  assert.strictEqual(decryptCredential(rowAfter.portal_pass), legacyPass, 'Decrypted legacy password must match original plaintext');
  console.log('✅ Legacy plaintext migration successfully converted legacy rows');

  // Clean up
  db.prepare('DELETE FROM applications WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM activity_log WHERE user_id = ?').run(testUserId);
  console.log('\n🎉 ALL TASK 2.1 PORTAL PASSWORD ENCRYPTION TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

