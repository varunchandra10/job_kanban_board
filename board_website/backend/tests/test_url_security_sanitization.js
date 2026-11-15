/**
 * Automated Verification Suite: URL Security & XSS Neutralization (Phase 1.1)
 * Validates sanitizeUrl against malicious injection vectors (javascript:, data:, vbscript:, null-bytes)
 */

const assert = require('assert');

// Mirror logic of frontend src/utils/security.ts
function sanitizeUrl(url) {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (!trimmed || trimmed === '#') return '#';

  // Explicitly safe schemes: http, https, mailto, tel
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    // Reject strings with embedded control characters or null bytes
    if (/[\0\x00-\x1F]/.test(trimmed)) {
      return '#';
    }
    return trimmed;
  }

  // Strip any leading dangerous or unknown scheme(s) (e.g., javascript:, data:, vbscript:)
  const stripped = trimmed.replace(/^([a-zA-Z0-9+.-]+:)+/, '');
  if (!stripped || stripped === '#') return '#';

  // Return safe https-prefixed URL
  return `https://${stripped}`;
}

async function runTests() {
  console.log('--- Running URL Security & XSS Neutralization Tests ---');

  // Test 1: Valid explicit schemes pass through unmodified
  assert.strictEqual(sanitizeUrl('https://github.com/varunchandra10'), 'https://github.com/varunchandra10');
  assert.strictEqual(sanitizeUrl('http://portfolio.example.org/demo'), 'http://portfolio.example.org/demo');
  assert.strictEqual(sanitizeUrl('mailto:recruiter@company.com'), 'mailto:recruiter@company.com');
  assert.strictEqual(sanitizeUrl('tel:+15551234567'), 'tel:+15551234567');
  console.log('✓ Test 1 Passed: Valid standard web protocols are preserved.');

  // Test 2: Bare domains automatically prepend https://
  assert.strictEqual(sanitizeUrl('github.com/user/project'), 'https://github.com/user/project');
  assert.strictEqual(sanitizeUrl('linkedin.com/in/candidate'), 'https://linkedin.com/in/candidate');
  assert.strictEqual(sanitizeUrl('www.google.com'), 'https://www.google.com');
  console.log('✓ Test 2 Passed: Bare domains safely receive https:// prefix.');

  // Test 3: Classic javascript: injection neutralized
  const jsPayload1 = 'javascript:alert(document.cookie)';
  const sanitized1 = sanitizeUrl(jsPayload1);
  assert.ok(!sanitized1.toLowerCase().startsWith('javascript:'), 'javascript: scheme must be stripped');
  assert.strictEqual(sanitized1, 'https://alert(document.cookie)');
  console.log('✓ Test 3 Passed: javascript: scheme stripped and converted to harmless https link.');

  // Test 4: Case insensitive injection (JAVASCRIPT:)
  const jsPayload2 = 'JavaScript:alert(1)';
  const sanitized2 = sanitizeUrl(jsPayload2);
  assert.ok(!sanitized2.toLowerCase().startsWith('javascript:'));
  assert.strictEqual(sanitized2, 'https://alert(1)');
  console.log('✓ Test 4 Passed: Case insensitive JAVASCRIPT: scheme neutralized.');

  // Test 5: Nested / Multi-layered pseudo-protocol bypass (javascript:javascript:)
  const nestedJs = 'javascript:javascript:alert(document.domain)';
  const sanitizedNested = sanitizeUrl(nestedJs);
  assert.ok(!sanitizedNested.toLowerCase().startsWith('javascript:'));
  assert.strictEqual(sanitizedNested, 'https://alert(document.domain)');
  console.log('✓ Test 5 Passed: Nested recursive schemes stripped.');

  // Test 6: data: URI script injection neutralized
  const dataPayload = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
  const sanitizedData = sanitizeUrl(dataPayload);
  assert.ok(!sanitizedData.toLowerCase().startsWith('data:'));
  assert.strictEqual(sanitizedData, 'https://text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
  console.log('✓ Test 6 Passed: data: scheme neutralized.');

  // Test 7: vbscript: injection neutralized
  const vbPayload = 'vbscript:msgbox("pwned")';
  const sanitizedVb = sanitizeUrl(vbPayload);
  assert.ok(!sanitizedVb.toLowerCase().startsWith('vbscript:'));
  assert.strictEqual(sanitizedVb, 'https://msgbox("pwned")');
  console.log('✓ Test 7 Passed: vbscript: scheme neutralized.');

  // Test 8: Null-byte injection attempts
  const nullBytePayload = 'https://google.com\0/malicious';
  assert.strictEqual(sanitizeUrl(nullBytePayload), '#');
  console.log('✓ Test 8 Passed: Control characters and null bytes rejected.');

  // Test 9: Null, undefined, empty string fallback to '#'
  assert.strictEqual(sanitizeUrl(null), '#');
  assert.strictEqual(sanitizeUrl(undefined), '#');
  assert.strictEqual(sanitizeUrl(''), '#');
  assert.strictEqual(sanitizeUrl('   '), '#');
  assert.strictEqual(sanitizeUrl('#'), '#');
  console.log('✓ Test 9 Passed: Empty and invalid inputs safely fallback to "#".');

  console.log('✅ All URL Security & XSS Neutralization Tests PASSED successfully.');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

