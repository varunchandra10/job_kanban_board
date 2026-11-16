process.env.NODE_ENV = 'test';
process.env.TURSO_DATABASE_URL = '';

const assert = require('assert');
const { signToken, verifyToken } = require('../src/services/jwtService');

async function runTests() {
  console.log('🧪 Starting Task 1.2 Constant-Time JWT Verification Tests...\n');

  // 1. Test Valid Token Signing & Verification
  console.log('--- 1. Testing valid token signing and verification ---');
  const userPayload = { id: 'usr_abc123', email: 'engineer@google.com', name: 'Software Engineer' };
  const token = signToken(userPayload, 3600);
  assert.ok(token && typeof token === 'string', 'Token must be a non-empty string');
  assert.strictEqual(token.split('.').length, 3, 'JWT must contain exactly 3 dot-separated parts');

  const decoded = verifyToken(token);
  assert.ok(decoded, 'Valid token must be successfully decoded');
  assert.strictEqual(decoded.id, userPayload.id);
  assert.strictEqual(decoded.email, userPayload.email);
  assert.strictEqual(decoded.name, userPayload.name);
  console.log('✅ Valid token verified and decoded payload correctly');

  // 2. Test Tampered Signature Rejection (Timing side-channel defense)
  console.log('\n--- 2. Testing tampered signature rejection ---');
  const [header, payload, signature] = token.split('.');
  
  // Flip the last character in the signature
  const lastChar = signature.slice(-1);
  const replacementChar = lastChar === 'a' ? 'b' : 'a';
  const tamperedSig = signature.slice(0, -1) + replacementChar;
  const tamperedToken = `${header}.${payload}.${tamperedSig}`;

  const tamperedResult = verifyToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token signature must return null');
  console.log('✅ Tampered signature rejected cleanly');

  // 3. Test Signature Length Mismatch (Truncation / Padding)
  console.log('\n--- 3. Testing signature length mismatch rejection ---');
  const truncatedSigToken = `${header}.${payload}.${signature.slice(0, -4)}`;
  assert.strictEqual(verifyToken(truncatedSigToken), null, 'Truncated signature must return null');

  const paddedSigToken = `${header}.${payload}.${signature}ABCD`;
  assert.strictEqual(verifyToken(paddedSigToken), null, 'Over-length signature must return null');
  console.log('✅ Different signature length rejected safely without throwing');

  // 4. Test Expired Token Rejection
  console.log('\n--- 4. Testing expired token rejection ---');
  const expiredToken = signToken(userPayload, -10); // Expired 10 seconds ago
  const expiredResult = verifyToken(expiredToken);
  assert.strictEqual(expiredResult, null, 'Expired token must return null');
  console.log('✅ Expired token rejected');

  // 5. Test Malformed / Non-String Tokens
  console.log('\n--- 5. Testing malformed token handling ---');
  assert.strictEqual(verifyToken(''), null);
  assert.strictEqual(verifyToken(null), null);
  assert.strictEqual(verifyToken(undefined), null);
  assert.strictEqual(verifyToken('invalid.token'), null);
  assert.strictEqual(verifyToken('one.two.three.four'), null);
  assert.strictEqual(verifyToken('invalid_header.invalid_payload.invalid_sig'), null);
  console.log('✅ Malformed inputs safely return null');

  console.log('\n🎉 ALL TASK 1.2 CONSTANT-TIME JWT TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

