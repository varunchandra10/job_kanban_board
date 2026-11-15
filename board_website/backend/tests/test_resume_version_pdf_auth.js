/**
 * Automated Verification Suite: Resume Version PDF Preview Authorization (Phase 2.3)
 *
 * Verifies:
 * 1. GET /api/versions/:id/pdf accepts query-string tokens (?token=...) via isFileViewPath.
 * 2. GET /api/versions/:id/pdf accepts standard Bearer <token> in Authorization header.
 * 3. Anonymous requests without token reject with 401 Unauthorized.
 * 4. Invalid or tampered query-string tokens reject with 401 Unauthorized.
 * 5. Successful PDF request streams correct Content-Type: application/pdf and binary payload.
 * 6. User boundary isolation: User B cannot view User A's version PDF (returns 404).
 * 7. Query-string tokens are not accepted for mutating endpoints (e.g. DELETE /api/versions/:id).
 */

process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
process.env.NODE_ENV = 'test';

const assert = require('assert');
const app = require('../src/app');
const { signToken } = require('../src/services/jwtService');
const { db } = require('../src/database/db');

function executeRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const resHeaders = {};
    let responseBody = null;
    let rawBuffer = Buffer.alloc(0);

    const res = {
      statusCode: 200,
      setHeader(name, val) {
        resHeaders[name.toLowerCase()] = val;
        return this;
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()];
      },
      writeHead(c, h = {}) {
        this.statusCode = c;
        for (const [k, v] of Object.entries(h)) {
          resHeaders[k.toLowerCase()] = v;
        }
        return this;
      },
      end(data) {
        if (data) {
          if (Buffer.isBuffer(data)) {
            rawBuffer = Buffer.concat([rawBuffer, data]);
          } else {
            rawBuffer = Buffer.concat([rawBuffer, Buffer.from(data)]);
          }
        }
        const text = rawBuffer.toString('utf8');
        try {
          responseBody = JSON.parse(text);
        } catch (_) {
          responseBody = text;
        }
        resolve({
          status: this.statusCode,
          headers: resHeaders,
          body: responseBody,
          rawBuffer
        });
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

async function runTests() {
  console.log('\n--- Running Resume Version PDF Preview Auth Test Suite (Phase 2.3) ---');

  const userAliceId = 'usr_alice_pdf_test';
  const userBobId = 'usr_bob_pdf_test';

  const aliceToken = signToken({ id: userAliceId, email: 'alice@pdf.test' });
  const bobToken = signToken({ id: userBobId, email: 'bob@pdf.test' });

  // Setup mock resume version record in database
  db.exec(`
    CREATE TABLE IF NOT EXISTS resume_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      label TEXT,
      region TEXT,
      pdf_name TEXT,
      pdf_data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const mockPdfContent = '%PDF-1.5 Mock Resume Version PDF for Alice Test';
  const mockBase64 = Buffer.from(mockPdfContent).toString('base64');

  db.prepare('DELETE FROM resume_versions WHERE user_id = ?').run(userAliceId);
  const insertInfo = db.prepare(`
    INSERT INTO resume_versions (user_id, label, region, pdf_name, pdf_data)
    VALUES (?, 'Full Stack SWE', 'US', 'alice_swe_resume.pdf', ?)
  `).run(userAliceId, `data:application/pdf;base64,${mockBase64}`);

  const versionId = insertInfo.lastInsertRowid;
  console.log(`Created test resume version (ID: ${versionId}) for Alice`);

  // Test 1: Anonymous request without token -> 401
  console.log('Test 1: GET /api/versions/:id/pdf without token rejects with 401');
  const anonRes = await executeRequest('GET', `/api/versions/${versionId}/pdf`);
  assert.strictEqual(anonRes.status, 401);
  console.log('✓ Anonymous request rejected with 401');

  // Test 2: Invalid / tampered token in query string -> 401
  console.log('Test 2: GET /api/versions/:id/pdf?token=invalid rejects with 401');
  const invalidRes = await executeRequest('GET', `/api/versions/${versionId}/pdf?token=invalid.jwt.token`);
  assert.strictEqual(invalidRes.status, 401);
  console.log('✓ Invalid query token rejected with 401');

  // Test 3: Standard Bearer token in Authorization header -> 200 PDF stream
  console.log('Test 3: GET /api/versions/:id/pdf with Authorization: Bearer <token> returns 200');
  const bearerRes = await executeRequest('GET', `/api/versions/${versionId}/pdf`, {
    authorization: `Bearer ${aliceToken}`
  });
  assert.strictEqual(bearerRes.status, 200);
  assert.strictEqual(bearerRes.headers['content-type'], 'application/pdf');
  assert(bearerRes.rawBuffer.toString().includes('PDF-1.5 Mock Resume Version PDF'));
  console.log('✓ Header-authenticated request served PDF with 200');

  // Test 4: Query-string token in GET /api/versions/:id/pdf?token=<token> -> 200 PDF stream
  console.log('Test 4: GET /api/versions/:id/pdf?token=<token> returns 200 application/pdf');
  const queryRes = await executeRequest('GET', `/api/versions/${versionId}/pdf?token=${encodeURIComponent(aliceToken)}`);
  assert.strictEqual(queryRes.status, 200);
  assert.strictEqual(queryRes.headers['content-type'], 'application/pdf');
  assert(queryRes.rawBuffer.toString().includes('PDF-1.5 Mock Resume Version PDF'));
  console.log('✓ Query-token request authorized via isFileViewPath and served PDF with 200');

  // Test 5: Scoped file-view token in query string -> 200 PDF stream
  console.log('Test 5: GET /api/versions/:id/pdf?token=<scoped_file_token> returns 200');
  const scopedToken = signToken({ id: userAliceId, email: 'alice@pdf.test', scope: 'file_view' }, 3600);
  const scopedRes = await executeRequest('GET', `/api/versions/${versionId}/pdf?token=${encodeURIComponent(scopedToken)}`);
  assert.strictEqual(scopedRes.status, 200);
  assert.strictEqual(scopedRes.headers['content-type'], 'application/pdf');
  console.log('✓ Scoped file viewing token accepted for resume version PDF preview');

  // Test 6: Cross-user boundary isolation (Bob cannot view Alice's version) -> 404
  console.log("Test 6: User Bob cannot view Alice's resume version PDF (IDOR protection)");
  const bobRes = await executeRequest('GET', `/api/versions/${versionId}/pdf?token=${encodeURIComponent(bobToken)}`);
  assert.strictEqual(bobRes.status, 404, 'Must return 404 when user does not own resume version');
  console.log('✓ Cross-user isolation enforced (returns 404)');

  // Test 7: Query-string token is REJECTED for mutating endpoints
  console.log('Test 7: Mutating endpoint DELETE /api/versions/:id?token=... rejects query token');
  const deleteRes = await executeRequest('DELETE', `/api/versions/${versionId}?token=${encodeURIComponent(aliceToken)}`);
  assert.strictEqual(deleteRes.status, 401, 'Mutating endpoints must NOT accept query tokens');
  console.log('✓ Mutating endpoints reject query-string tokens (CSRF protection)');

  console.log('\n✅ ALL 7 RESUME VERSION PDF AUTH TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

