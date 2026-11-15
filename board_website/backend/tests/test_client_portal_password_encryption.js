/**
 * Automated Verification Suite: Client Portal Password Encryption at Rest (Phase 1.2)
 *
 * Verifies:
 * 1. Client secrets are encrypted with AES-256-GCM using Web Crypto API.
 * 2. Serialized format conforms to enc:v1:<b64Iv>:<b64Cipher>.
 * 3. Plaintext passwords never leak into localStorage serialized JSON.
 * 4. Distinct initialization vectors (IVs) are generated per encryption call (CPA security).
 * 5. Full round-trip decryption restores exact original plaintext.
 * 6. Corrupt payloads or key mismatches fail safely without throwing exceptions.
 * 7. Storage batch encryption is idempotent (never double-encrypts).
 */

const assert = require('assert');
const crypto = require('crypto');

// Ensure Web Crypto API availability in Node test environment
const webCrypto = globalThis.crypto?.subtle ? globalThis.crypto : crypto.webcrypto;

function uint8ToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function base64ToUint8(b64) {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function encryptClientSecret(plainText, secretKey) {
  if (!plainText) return '';
  const keySource = secretKey || 'job_tracker_test_session_token';
  try {
    const enc = new TextEncoder();
    const rawKey = await webCrypto.subtle.digest('SHA-256', enc.encode(keySource + ':portal_client_salt_v1'));
    const key = await webCrypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = webCrypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await webCrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));

    const b64Iv = uint8ToBase64(iv);
    const b64Cipher = uint8ToBase64(new Uint8Array(cipherBuffer));
    return `enc:v1:${b64Iv}:${b64Cipher}`;
  } catch (err) {
    return plainText;
  }
}

async function decryptClientSecret(cipherText, secretKey) {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc:v1:')) return cipherText;
  const keySource = secretKey || 'job_tracker_test_session_token';
  try {
    const parts = cipherText.split(':');
    if (parts.length < 4) return '';
    const b64Iv = parts[2];
    const b64Cipher = parts[3];

    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const rawKey = await webCrypto.subtle.digest('SHA-256', enc.encode(keySource + ':portal_client_salt_v1'));
    const key = await webCrypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = base64ToUint8(b64Iv);
    const cipherData = base64ToUint8(b64Cipher);

    const decryptedBuffer = await webCrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherData);
    return dec.decode(decryptedBuffer);
  } catch (err) {
    return '';
  }
}

async function encryptApplicationsForStorage(apps, secretKey) {
  return Promise.all(
    apps.map(async app => {
      if (!app.portal_pass || app.portal_pass.startsWith('enc:v1:')) {
        return app;
      }
      const encrypted = await encryptClientSecret(app.portal_pass, secretKey);
      return {
        ...app,
        portal_pass: encrypted,
      };
    })
  );
}

async function decryptApplicationsFromStorage(apps, secretKey) {
  return Promise.all(
    apps.map(async app => {
      if (!app.portal_pass || !app.portal_pass.startsWith('enc:v1:')) {
        return app;
      }
      const decrypted = await decryptClientSecret(app.portal_pass, secretKey);
      return {
        ...app,
        portal_pass: decrypted,
      };
    })
  );
}

async function runTestSuite() {
  console.log('\n--- Running Client Portal Password Encryption Test Suite (Phase 1.2) ---');

  const sessionToken = 'mock-jwt-auth-token-user-12345';
  const rawSecret = 'SuperSecretCompanyPortalPass123!@#';

  // Test 1: Format validation
  console.log('Test 1: Validate encrypted envelope structure (enc:v1:<iv>:<ciphertext>)');
  const encrypted = await encryptClientSecret(rawSecret, sessionToken);
  assert(encrypted.startsWith('enc:v1:'), 'Encrypted secret must start with enc:v1:');
  const parts = encrypted.split(':');
  assert.strictEqual(parts.length, 4, 'Encrypted secret must have exactly 4 parts separated by colon');
  assert.strictEqual(parts[0], 'enc');
  assert.strictEqual(parts[1], 'v1');
  assert(parts[2].length >= 16, 'Base64 IV must be valid length');
  assert(parts[3].length >= 16, 'Base64 ciphertext must be valid length');
  assert(!encrypted.includes(rawSecret), 'Ciphertext must NEVER contain plaintext secret');
  console.log('✓ Encrypted envelope conforms to schema: ' + encrypted.slice(0, 32) + '...');

  // Test 2: CPA Security (Distinct IVs)
  console.log('Test 2: Random IV verification across multiple encryptions of same secret');
  const enc1 = await encryptClientSecret(rawSecret, sessionToken);
  const enc2 = await encryptClientSecret(rawSecret, sessionToken);
  assert.notStrictEqual(enc1, enc2, 'Two encryptions of identical plaintext must yield different ciphertexts');
  assert.notStrictEqual(enc1.split(':')[2], enc2.split(':')[2], 'IVs must be uniquely generated');
  console.log('✓ IV randomization confirmed (CPA semantic security)');

  // Test 3: Round-trip Decryption
  console.log('Test 3: Round-trip decryption back to plaintext');
  const decrypted1 = await decryptClientSecret(enc1, sessionToken);
  const decrypted2 = await decryptClientSecret(enc2, sessionToken);
  assert.strictEqual(decrypted1, rawSecret, 'Decrypted secret 1 must match raw password');
  assert.strictEqual(decrypted2, rawSecret, 'Decrypted secret 2 must match raw password');
  console.log('✓ Round-trip decryption successful: ' + decrypted1);

  // Test 4: Tamper & Invalid Key Resistance
  console.log('Test 4: Tampered ciphertext or wrong session key rejects safely');
  const wrongKeyDec = await decryptClientSecret(enc1, 'wrong-session-token');
  assert.strictEqual(wrongKeyDec, '', 'Decryption with wrong session key must return empty string');

  const tampered = enc1.slice(0, -4) + 'AAAA';
  const tamperedDec = await decryptClientSecret(tampered, sessionToken);
  assert.strictEqual(tamperedDec, '', 'Decryption of corrupted ciphertext must return empty string without throw');
  console.log('✓ Tamper and invalid key authentication verified');

  // Test 5: Batch Application Storage Sanitization
  console.log('Test 5: Batch applications encryption for localStorage');
  const sampleApps = [
    { id: 1, company: 'Google', portal_user: 'alice@google.com', portal_pass: 'GooglePass2026!' },
    { id: 2, company: 'Meta', portal_user: 'alice@meta.com', portal_pass: '' },
    { id: 3, company: 'Amazon', portal_user: 'alice@amazon.com', portal_pass: 'AmazonSecret#99' },
    { id: 4, company: 'Stripe', portal_user: 'alice@stripe.com' } // no password field
  ];

  const storageApps = await encryptApplicationsForStorage(sampleApps, sessionToken);
  assert(storageApps[0].portal_pass.startsWith('enc:v1:'), 'App 1 password must be encrypted');
  assert.strictEqual(storageApps[1].portal_pass, '', 'App 2 empty password remains empty');
  assert(storageApps[2].portal_pass.startsWith('enc:v1:'), 'App 3 password must be encrypted');
  assert.strictEqual(storageApps[3].portal_pass, undefined, 'App 4 without password remains undefined');

  // Verify JSON storage simulation
  const serialized = JSON.stringify(storageApps);
  assert(!serialized.includes('GooglePass2026!'), 'Serialized localStorage JSON must not leak GooglePass2026!');
  assert(!serialized.includes('AmazonSecret#99'), 'Serialized localStorage JSON must not leak AmazonSecret#99');
  console.log('✓ Storage payload sanitized; 0 plaintext credentials leak into serialized JSON');

  // Test 6: Idempotency (no double-encryption)
  console.log('Test 6: Storage encryption idempotency');
  const doubleEncrypted = await encryptApplicationsForStorage(storageApps, sessionToken);
  assert.strictEqual(doubleEncrypted[0].portal_pass, storageApps[0].portal_pass, 'Already encrypted password must not be re-encrypted');
  console.log('✓ Storage encryption is idempotent');

  // Test 7: Batch Decryption back to in-memory state
  console.log('Test 7: Batch restoration from localStorage into memory');
  const restoredApps = await decryptApplicationsFromStorage(storageApps, sessionToken);
  assert.strictEqual(restoredApps[0].portal_pass, 'GooglePass2026!');
  assert.strictEqual(restoredApps[1].portal_pass, '');
  assert.strictEqual(restoredApps[2].portal_pass, 'AmazonSecret#99');
  assert.strictEqual(restoredApps[3].portal_pass, undefined);
  console.log('✓ Batch restored successfully to active in-memory state');

  console.log('\n✅ ALL 7 CLIENT PORTAL PASSWORD CRYPTO TESTS PASSED!\n');
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
