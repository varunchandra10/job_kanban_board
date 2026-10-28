process.env.TURSO_DATABASE_URL = ''; // Local SQLite mode

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { openDatabaseWithRetry, db } = require('../src/database/db');

async function runTests() {
  console.log('🧪 Starting Task 3.1 Destructive Database Deletion Fallback Removal Tests...\n');

  // --- Test 1: Transient Lock Recovery with Exponential Backoff ---
  console.log('--- 1. Testing retry and recovery on transient lock failure ---');
  let attemptCount = 0;
  class MockTransientDb {
    constructor(dbPath) {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error(`SQLITE_BUSY: database is locked (simulated failure ${attemptCount})`);
      }
      this.connected = true;
      this.path = dbPath;
    }
  }

  const recoveredInstance = openDatabaseWithRetry(MockTransientDb, 'dummy_test.db', 3, 20);
  assert(recoveredInstance && recoveredInstance.connected, 'Expected database to successfully open on 3rd attempt');
  assert.strictEqual(attemptCount, 3, `Expected exactly 3 attempts, got ${attemptCount}`);
  console.log('✅ Transient lock contention resolved via backoff retry');

  // --- Test 2: Persistent Lock Contention NEVER Deletes Database File ---
  console.log('\n--- 2. Testing that persistent failure NEVER unlinks the file ---');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'db-test-'));
  const testDbFile = path.join(tempDir, 'user_important_tracker.db');
  const originalData = 'CRITICAL_USER_CAREER_DATA_CANNOT_BE_LOST';
  fs.writeFileSync(testDbFile, originalData, 'utf8');

  class MockAlwaysLockedDb {
    constructor(dbPath) {
      throw new Error('EBUSY: resource busy or locked');
    }
  }

  let errorThrown = null;
  try {
    openDatabaseWithRetry(MockAlwaysLockedDb, testDbFile, 3, 20);
  } catch (err) {
    errorThrown = err;
  }

  assert(errorThrown, 'Expected openDatabaseWithRetry to throw critical error on persistent failure');
  assert(errorThrown.message.includes('[CRITICAL DATABASE ERROR]'), `Error message should be critical diagnostic, got: ${errorThrown.message}`);
  assert(errorThrown.message.includes('PRESERVED to prevent data loss'), 'Error message must inform user file was preserved');

  // THE KEY TEST: Verify the database file was NOT deleted!
  assert(fs.existsSync(testDbFile), 'CRITICAL: Database file MUST NOT be deleted on error!');
  const dataAfterError = fs.readFileSync(testDbFile, 'utf8');
  assert.strictEqual(dataAfterError, originalData, 'Database file contents must remain completely intact!');
  console.log('✅ Database file was safely PRESERVED without deletion');

  // --- Test 3: Real Database Opening in Running Application ---
  console.log('\n--- 3. Testing that standard database handle is healthy ---');
  assert(db && typeof db.prepare === 'function', 'Default application db must be ready and functional');
  const testQuery = db.prepare('SELECT 1 as alive').get();
  assert.strictEqual(testQuery.alive, 1, 'Database must be capable of executing queries');
  console.log('✅ Standard database connection is healthy');

  // Clean up
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}

  console.log('\n🎉 ALL TASK 3.1 DATABASE UNLINK SAFEGUARD TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

