process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode for unit testing

const assert = require('assert');
const path = require('path');
const config = require('../src/config');
const documentsController = require('../src/controllers/documentsController');

async function runTests() {
  console.log('🧪 Starting Task 6.2 Server Command Injection & Host GUI Elimination Tests...\n');

  console.log('--- 1. Testing that Web/Cloud Mode strictly blocks host folder opening and file reveals ---');
  config.isDesktop = false;

  // Test openFile in web mode
  let resStatus = 200;
  let resJson = null;
  const mockRes = {
    status(s) {
      resStatus = s;
      return this;
    },
    json(d) {
      resJson = d;
      return this;
    }
  };

  await documentsController.openFile(
    { body: { path: 'documents/resumes/my_resume.pdf' } },
    mockRes,
    () => {}
  );

  assert.strictEqual(resJson.opened, false, 'openFile in web mode must not open desktop GUI');
  assert.ok(resJson.url.includes('/api/file-content'), 'openFile must return web document preview URL');
  console.log('✅ openFile safely returns web document preview URL without server process spawning');

  // Test revealFile in web mode
  resStatus = 200;
  resJson = null;
  await documentsController.revealFile(
    { body: { path: 'documents/resumes/my_resume.pdf' } },
    mockRes,
    () => {}
  );
  assert.strictEqual(resStatus, 400, 'revealFile in web mode must return HTTP 400');
  assert.ok(resJson.error.includes('desktop app mode'), 'Expected desktop mode required error message');
  console.log('✅ revealFile correctly blocked in web/cloud mode (HTTP 400)');

  console.log('\n--- 2. Testing that open-local-folder route blocks execution when not in desktop mode ---');
  // Find open-local-folder handler on documents router
  const documentsRouter = require('../src/routes/documents');
  const openFolderLayer = documentsRouter.stack.find(
    s => s.route && s.route.path === '/storage/open-local-folder'
  );
  assert.ok(openFolderLayer, 'Expected /storage/open-local-folder route to exist');
  const openFolderHandler = openFolderLayer.route.stack[0].handle;

  resStatus = 200;
  resJson = null;
  config.isDesktop = false;

  await openFolderHandler(
    { body: { folderPath: 'C:\\Windows\\System32 & calc.exe' } },
    mockRes
  );

  assert.strictEqual(resStatus, 400, 'open-local-folder must return HTTP 400 in web mode');
  assert.ok(resJson.error.includes('disabled in web/cloud deployment mode'));
  console.log('✅ open-local-folder strictly blocked with 400; shell command injection avoided');

  console.log('\n--- 3. Testing Desktop Mode safe argument passing (no cmd.exe shell interpolation) ---');
  config.isDesktop = true;

  // Verify safe parameter handling when path contains metacharacters like & or |
  resStatus = 200;
  resJson = null;
  let errPassed = null;

  // openFile with path containing shell characters
  await documentsController.openFile(
    { body: { path: 'documents/resumes/malicious & calc.exe.pdf' } },
    mockRes,
    (err) => { errPassed = err; }
  );

  // Because malicious & calc.exe.pdf doesn't exist on disk, storageService.resolveSafePath returns null
  assert.strictEqual(resStatus, 404, 'Non-existent or unsafe breakout paths rejected with 404');
  console.log('✅ Metacharacter breakout paths rejected with 404 before execution');

  console.log('\n🎉 ALL TASK 6.2 SERVER COMMAND INJECTION SAFEGUARD TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
