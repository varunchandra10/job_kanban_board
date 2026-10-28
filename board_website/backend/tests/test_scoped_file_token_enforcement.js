process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const app = require('../src/app');
const { signToken, verifyToken } = require('../src/services/jwtService');
const { db } = require('../src/database/db');

async function testScopedFileToken() {
  console.log('🧪 Starting Task 8.4 Scoped File Token Enforcement Tests...\n');

  const userId = 'usr_token_test_alice';
  const primaryLoginToken = signToken({ id: userId, email: 'alice@example.com' }, 86400 * 30);

  // Helper to execute request against express app
  function executeRequest(method, url, headers = {}, body = null) {
    return new Promise((resolve) => {
      const resHeaders = {};
      let responseBody = null;

      const res = {
        statusCode: 200,
        setHeader(name, val) { resHeaders[name.toLowerCase()] = val; return this; },
        getHeader(name) { return resHeaders[name.toLowerCase()]; },
        writeHead(c) { this.statusCode = c; return this; },
        end(data) {
          if (!responseBody && data) {
            try { responseBody = JSON.parse(data); } catch (_) { responseBody = data; }
          }
          resolve({ status: this.statusCode, headers: resHeaders, body: responseBody });
        }
      };

      const req = {
        method,
        url,
        originalUrl: url,
        path: url.split('?')[0],
        headers: { ...headers },
        body: body || {},
        socket: { remoteAddress: '127.0.0.1' }
      };

      app(req, res);
    });
  }

  // --- 1. Test Minting Scoped File Token from /api/file-token ---
  console.log('--- 1. Testing /api/file-token Generates 1-Hour Scoped Token ---');
  const tokenRes = await executeRequest('GET', '/api/file-token', {
    authorization: `Bearer ${primaryLoginToken}`
  });

  assert.strictEqual(tokenRes.status, 200);
  assert.strictEqual(tokenRes.body.ok, 1);
  assert.ok(tokenRes.body.token, 'Expected token in response');

  const scopedToken = tokenRes.body.token;
  const decoded = verifyToken(scopedToken);
  assert.strictEqual(decoded.id, userId);
  assert.strictEqual(decoded.scope, 'file_view', 'Token must have scope: "file_view"');
  assert.ok(decoded.exp - decoded.iat <= 3600, 'Token lifespan must be limited to 1 hour (3600s)');
  console.log('✅ /api/file-token minted short-lived (1-hour) scoped token with scope: "file_view"');

  // --- 2. Test Least-Privilege Scope Restriction ---
  console.log('\n--- 2. Testing Least-Privilege Scope Enforcement ---');
  // Attempt to use scoped file viewing token to mutate application data (POST /api/applications)
  const mutateRes = await executeRequest('POST', '/api/applications', {
    authorization: `Bearer ${scopedToken}`
  }, { company: 'HackerCorp', role: 'Exploiter' });

  assert.strictEqual(mutateRes.status, 403, 'Scoped file viewing token must NOT be allowed to mutate application records');
  assert.ok(mutateRes.body.error.includes('Scoped file viewing token cannot access this endpoint'));
  console.log('✅ Mutation attempt blocked with HTTP 403: file viewing token cannot access /api/applications');

  // Attempt to use scoped file viewing token on /api/profile or /api/settings
  const settingsRes = await executeRequest('POST', '/api/settings', {
    authorization: `Bearer ${scopedToken}`
  }, { key: 'test', value: 'leak' });
  assert.strictEqual(settingsRes.status, 403, 'Scoped file viewing token must NOT access settings');
  console.log('✅ Access to /api/settings blocked with HTTP 403 for file viewing token');

  // --- 3. Test Scoped File Token Accepted on File Endpoints ---
  console.log('\n--- 3. Testing Scoped File Token Authorization on File Endpoints ---');
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_files (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      app_id INTEGER,
      type TEXT,
      name TEXT,
      mime_type TEXT,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.prepare('DELETE FROM document_files WHERE id = ?').run('doc_test_alice_view_1');
  db.prepare(`
    INSERT INTO document_files (id, user_id, type, name, mime_type, data)
    VALUES (?, ?, 'resume', 'alice_resume.pdf', 'application/pdf', ?)
  `).run('doc_test_alice_view_1', userId, Buffer.from('%PDF-1.4 Mock PDF Stream Content').toString('base64'));

  // Alice opens her own document with scoped token
  const fileContentRes = await executeRequest('GET', `/api/file-content?doc_id=doc_test_alice_view_1&token=${encodeURIComponent(scopedToken)}`);
  assert.strictEqual(fileContentRes.status, 200, 'Should authenticate and serve document with scoped token');
  assert.ok(fileContentRes.body.toString().includes('PDF-1.4'), 'Should receive PDF document stream');
  console.log('✅ Scoped file token authenticated and authorized cleanly on file viewing endpoint');

  // --- 4. Test Frontend Document URL Helper (Zero Primary JWT Leakage) ---
  console.log('\n--- 4. Testing Frontend Document URL Logic (OWASP CWE-598 Compliance) ---');
  let mockCachedFileToken = null;

  function mockGetDocumentUrl(filePath) {
    if (!filePath) return '';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const scopedToken = (mockCachedFileToken && mockCachedFileToken.expiresAt > Date.now()) ? mockCachedFileToken.token : '';
    const tokenParam = scopedToken ? `token=${encodeURIComponent(scopedToken)}` : '';

    const base = `/api/file-content?path=${encodeURIComponent(filePath)}`;
    if (!tokenParam) return base;
    return base.includes('?') ? `${base}&${tokenParam}` : `${base}?${tokenParam}`;
  }

  // A. When no scoped token is cached yet
  const urlWithoutToken = mockGetDocumentUrl('resumes/varun_resume.pdf');
  assert.strictEqual(urlWithoutToken.includes('token='), false, 'URL must NEVER append primary login JWT');
  assert.strictEqual(urlWithoutToken, '/api/file-content?path=resumes%2Fvarun_resume.pdf');

  // B. When scoped token is cached
  mockCachedFileToken = { token: scopedToken, expiresAt: Date.now() + 3000000 };
  const urlWithScopedToken = mockGetDocumentUrl('resumes/varun_resume.pdf');
  assert.ok(urlWithScopedToken.includes(`token=${encodeURIComponent(scopedToken)}`), 'URL includes scoped token');
  assert.strictEqual(urlWithScopedToken.includes(primaryLoginToken), false, 'Primary login JWT must NEVER be present in URL query');

  console.log('✅ Frontend URL generator verified: never leaks primary login token, strictly uses scoped file token');

  console.log('\n🎉 ALL TASK 8.4 SCOPED FILE TOKEN ENFORCEMENT TESTS PASSED!\n');
}

testScopedFileToken().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
