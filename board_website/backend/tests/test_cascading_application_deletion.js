process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { db } = require('../src/database/db');
const applicationsController = require('../src/controllers/applicationsController');
const config = require('../src/config');

async function testCascadingDeletion() {
  console.log('🧪 Starting Task 8.1 Cascading Application Deletion Tests...\n');

  // Ensure necessary tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT,
      role TEXT,
      stage TEXT DEFAULT 'Applied',
      resume_path TEXT DEFAULT '',
      cover_letter_path TEXT DEFAULT '',
      user_id TEXT DEFAULT 'default_user'
    );
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER,
      type TEXT,
      detail TEXT,
      ts TEXT DEFAULT (datetime('now')),
      user_id TEXT DEFAULT 'default_user'
    );
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

  const userA = 'usr_cascade_alice';
  const userB = 'usr_cascade_bob';

  // Clean up any leftovers from previous test runs
  db.prepare("DELETE FROM applications WHERE user_id IN (?, ?)").run(userA, userB);
  db.prepare("DELETE FROM document_files WHERE user_id IN (?, ?)").run(userA, userB);
  db.prepare("DELETE FROM activity_log WHERE user_id IN (?, ?)").run(userA, userB);

  // Create a temporary physical resume file in uploadDir
  const uploadDir = config.uploadDir || path.resolve(__dirname, '../uploads');
  const resumesDir = path.join(uploadDir, 'resumes');
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }
  const testFileName = `test_resume_alice_${Date.now()}.pdf`;
  const physicalFilePath = path.join(resumesDir, testFileName);
  fs.writeFileSync(physicalFilePath, '%PDF-1.4 Mock PDF content for Alice');
  assert.strictEqual(fs.existsSync(physicalFilePath), true, 'Physical test file should exist before deletion');

  // 1. Create Application for Alice with attached physical file
  db.prepare(`
    INSERT INTO applications (company, role, stage, resume_path, cover_letter_path, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Stripe', 'Senior Backend Engineer', 'Interview', physicalFilePath, '', userA);

  const aliceApp = db.prepare('SELECT id FROM applications WHERE company = ? AND user_id = ?').get('Stripe', userA);
  const aliceAppId = aliceApp.id;

  // Insert 3 activity logs for Alice's app
  db.prepare('INSERT INTO activity_log (app_id, type, detail, user_id) VALUES (?, ?, ?, ?)').run(aliceAppId, 'created', 'Created application', userA);
  db.prepare('INSERT INTO activity_log (app_id, type, detail, user_id) VALUES (?, ?, ?, ?)').run(aliceAppId, 'stage_change', 'Moved to Interview', userA);
  db.prepare('INSERT INTO activity_log (app_id, type, detail, user_id) VALUES (?, ?, ?, ?)').run(aliceAppId, 'note', 'Completed recruiter screen', userA);

  // Insert 2 document_files entries for Alice's app
  db.prepare('INSERT INTO document_files (id, user_id, app_id, type, name, data) VALUES (?, ?, ?, ?, ?, ?)').run('doc_alice_1', userA, aliceAppId, 'resume', 'resume.pdf', 'base64data1');
  db.prepare('INSERT INTO document_files (id, user_id, app_id, type, name, data) VALUES (?, ?, ?, ?, ?, ?)').run('doc_alice_2', userA, aliceAppId, 'cover_letter', 'cover.pdf', 'base64data2');

  // 2. Create Application, activity logs, and documents for Bob (User B) to test tenant isolation
  db.prepare(`
    INSERT INTO applications (company, role, stage, resume_path, cover_letter_path, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Google', 'Staff Software Engineer', 'Offer', '', '', userB);

  const bobApp = db.prepare('SELECT id FROM applications WHERE company = ? AND user_id = ?').get('Google', userB);
  const bobAppId = bobApp.id;

  db.prepare('INSERT INTO activity_log (app_id, type, detail, user_id) VALUES (?, ?, ?, ?)').run(bobAppId, 'created', 'Created application', userB);
  db.prepare('INSERT INTO document_files (id, user_id, app_id, type, name, data) VALUES (?, ?, ?, ?, ?, ?)').run('doc_bob_1', userB, bobAppId, 'resume', 'bob_resume.pdf', 'base64bob');

  // Verify setup counts before deletion
  assert.strictEqual(db.prepare('SELECT count(*) as count FROM activity_log WHERE app_id = ?').get(aliceAppId).count, 3);
  assert.strictEqual(db.prepare('SELECT count(*) as count FROM document_files WHERE app_id = ?').get(aliceAppId).count, 2);
  assert.strictEqual(db.prepare('SELECT count(*) as count FROM activity_log WHERE app_id = ?').get(bobAppId).count, 1);
  assert.strictEqual(db.prepare('SELECT count(*) as count FROM document_files WHERE app_id = ?').get(bobAppId).count, 1);

  console.log('✅ Initial test data created: Alice App (ID: ' + aliceAppId + ') with 3 logs, 2 docs, and 1 physical file.');

  // Helper mock for express req/res
  function mockReqRes(userId, appId) {
    let statusCode = 200;
    let jsonResult = null;
    return {
      req: {
        user: { id: userId },
        params: { id: String(appId) }
      },
      res: {
        status(c) { statusCode = c; return this; },
        json(data) { jsonResult = data; return this; },
        getStatusCode() { return statusCode; },
        getJson() { return jsonResult; }
      }
    };
  }

  // --- Test 1: Cross-user deletion isolation (Alice cannot delete Bob's app) ---
  console.log('\n--- 1. Testing Cross-Tenant Deletion Isolation ---');
  const unauthorizedDelete = mockReqRes(userA, bobAppId);
  await applicationsController.deleteApplication(unauthorizedDelete.req, unauthorizedDelete.res, (err) => { throw err; });
  assert.strictEqual(unauthorizedDelete.res.getJson().deleted, false, 'Alice must not be able to delete Bob application');

  const bobAppAfter = db.prepare('SELECT id FROM applications WHERE id = ?').get(bobAppId);
  assert(bobAppAfter, 'Bob application must remain completely intact');
  console.log('✅ Cross-tenant deletion prevented cleanly');

  // --- Test 2: Alice deletes her application ---
  console.log('\n--- 2. Testing Cascading Deletion of Alice’s Application ---');
  const authorizedDelete = mockReqRes(userA, aliceAppId);
  await applicationsController.deleteApplication(authorizedDelete.req, authorizedDelete.res, (err) => { throw err; });
  assert.strictEqual(authorizedDelete.res.getJson().ok, 1);
  assert.strictEqual(authorizedDelete.res.getJson().deleted, true, 'Alice application should report deleted: true');

  // Verify Alice application record is removed
  const aliceAppAfter = db.prepare('SELECT id FROM applications WHERE id = ?').get(aliceAppId);
  assert.strictEqual(aliceAppAfter, undefined, 'Alice application record must be deleted');

  // Verify all activity_log entries for Alice's app are removed
  const aliceLogsAfter = db.prepare('SELECT count(*) as count FROM activity_log WHERE app_id = ?').get(aliceAppId);
  assert.strictEqual(aliceLogsAfter.count, 0, 'All activity logs for deleted application must be cascaded and deleted');

  // Verify all document_files entries for Alice's app are removed
  const aliceDocsAfter = db.prepare('SELECT count(*) as count FROM document_files WHERE app_id = ?').get(aliceAppId);
  assert.strictEqual(aliceDocsAfter.count, 0, 'All document_files for deleted application must be cascaded and deleted');

  // Verify physical file was removed from the disk
  assert.strictEqual(fs.existsSync(physicalFilePath), false, 'Physical disk file must be deleted from upload directory');
  console.log('✅ Cascading deletion cleanly wiped application, activity_log, document_files, and physical disk file');

  // --- Test 3: Verify Bob's data was untouched by Alice's cascade ---
  console.log('\n--- 3. Verifying Other Users’ Data Remains Untouched ---');
  const bobLogsAfter = db.prepare('SELECT count(*) as count FROM activity_log WHERE app_id = ?').get(bobAppId);
  assert.strictEqual(bobLogsAfter.count, 1, 'Bob activity log must remain intact');

  const bobDocsAfter = db.prepare('SELECT count(*) as count FROM document_files WHERE app_id = ?').get(bobAppId);
  assert.strictEqual(bobDocsAfter.count, 1, 'Bob document file must remain intact');

  console.log('✅ Bob’s application, logs, and document records are 100% intact');

  console.log('\n🎉 ALL TASK 8.1 CASCADING APPLICATION DELETION TESTS PASSED!\n');
}

testCascadingDeletion().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
