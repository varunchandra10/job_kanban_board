process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const app = require('../src/app');
const { encryptCredential, decryptCredential } = require('../src/services/cryptoService');

async function testCryptoAndSecurityHeaders() {
  console.log('🧪 Starting Task 8.3 Crypto Decoupling & HTTP Security Headers Tests...\n');

  // Helper to execute request against app
  function executeRequest(originHeader = null) {
    return new Promise((resolve) => {
      const headers = {};
      const res = {
        setHeader(name, val) { headers[name.toLowerCase()] = val; return this; },
        getHeader(name) { return headers[name.toLowerCase()]; },
        writeHead() { return this; },
        end() { resolve(headers); }
      };

      const req = {
        method: 'GET',
        url: '/api/health',
        socket: { remoteAddress: '127.0.0.1' },
        headers: originHeader ? { origin: originHeader } : {}
      };

      app(req, res);
    });
  }

  // --- 1. Test HTTP Security Headers on /api/health ---
  console.log('--- 1. Testing HTTP Security Headers ---');
  const headers = await executeRequest();
  assert.strictEqual(headers['x-content-type-options'], 'nosniff', 'Must include X-Content-Type-Options: nosniff');
  assert.strictEqual(headers['x-frame-options'], 'SAMEORIGIN', 'Must include X-Frame-Options: SAMEORIGIN');
  assert.strictEqual(headers['referrer-policy'], 'strict-origin-when-cross-origin', 'Must include Referrer-Policy');
  assert.strictEqual(headers['x-xss-protection'], '1; mode=block', 'Must include X-XSS-Protection');
  console.log('✅ HTTP Security headers (nosniff, SAMEORIGIN, referrer-policy, XSS protection) verified on API responses');

  // --- 2. Test CORS Whitelisting ---
  console.log('\n--- 2. Testing CORS Origin Whitelist ---');
  // Allowed local and tauri origins
  const allowedHeaders1 = await executeRequest('http://localhost:5173');
  assert.strictEqual(allowedHeaders1['access-control-allow-origin'], 'http://localhost:5173', 'localhost:5173 must be allowed');

  const allowedHeaders2 = await executeRequest('tauri://localhost');
  assert.strictEqual(allowedHeaders2['access-control-allow-origin'], 'tauri://localhost', 'tauri://localhost must be allowed');

  const allowedHeaders3 = await executeRequest('https://job-kanban-board.vercel.app');
  assert.strictEqual(allowedHeaders3['access-control-allow-origin'], 'https://job-kanban-board.vercel.app', 'Vercel app origin must be allowed');

  // Unauthorized origin
  const blockedHeaders = await executeRequest('https://malicious-attacker.com');
  assert.strictEqual(blockedHeaders['access-control-allow-origin'], undefined, 'Unauthorized origin must NOT receive access-control-allow-origin header');
  console.log('✅ CORS correctly allowed trusted local/Tauri/Vercel origins and blocked untrusted origins');

  // --- 3. Test Cryptographic Decoupling from JWT_SECRET ---
  console.log('\n--- 3. Testing Cryptographic Decoupling from JWT_SECRET ---');
  const originalPlain = 'SecretP@ssw0rd!2026';
  const ciphertext = encryptCredential(originalPlain);
  assert.ok(ciphertext.startsWith('enc:v1:'), 'Ciphertext must start with enc:v1:');

  // Verify normal decryption
  const decrypted1 = decryptCredential(ciphertext);
  assert.strictEqual(decrypted1, originalPlain, 'Decrypted text must match plaintext');

  // Simulate rotating JWT_SECRET
  const originalJwtSecret = config.jwtSecret;
  config.jwtSecret = 'new-rotated-jwt-secret-that-would-break-coupled-encryption';

  // Verify ciphertext can STILL be decrypted because it uses independent .portal_key!
  const decryptedAfterRotation = decryptCredential(ciphertext);
  assert.strictEqual(decryptedAfterRotation, originalPlain, 'Ciphertext must remain decryptable after JWT_SECRET rotation');
  console.log('✅ Encryption key is decoupled from JWT_SECRET and survived JWT secret rotation');

  // --- 4. Test Backward Compatibility with Legacy Ciphertext ---
  console.log('\n--- 4. Testing Backward Compatibility with Legacy Ciphertexts ---');
  // Manually construct a ciphertext encrypted with the legacy JWT secret derivation
  const legacySecret = config.jwtSecret || 'job-tracker-dev-portal-secret-key';
  const legacyKey = crypto.createHash('sha256').update(legacySecret + ':portal_credentials_salt_v1').digest();
  const legacyIv = crypto.randomBytes(12);
  const legacyCipher = crypto.createCipheriv('aes-256-gcm', legacyKey, legacyIv);
  let legacyEncrypted = legacyCipher.update('OldLegacyPassword999', 'utf8', 'hex');
  legacyEncrypted += legacyCipher.final('hex');
  const legacyAuthTag = legacyCipher.getAuthTag();
  const legacyToken = `enc:v1:${legacyIv.toString('hex')}:${legacyAuthTag.toString('hex')}:${legacyEncrypted}`;

  const decryptedLegacy = decryptCredential(legacyToken);
  assert.strictEqual(decryptedLegacy, 'OldLegacyPassword999', 'Legacy ciphertext must be decrypted via backward-compatibility fallback');
  console.log('✅ Legacy ciphertexts encrypted prior to key decoupling decrypted successfully via fallback');

  // Restore config
  config.jwtSecret = originalJwtSecret;

  console.log('\n🎉 ALL TASK 8.3 CRYPTO & SECURITY HEADERS TESTS PASSED!\n');
}

testCryptoAndSecurityHeaders().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
