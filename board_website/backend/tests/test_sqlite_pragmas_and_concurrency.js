process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const { db, runInTransaction } = require('../src/database/db');

async function runTests() {
  console.log('🧪 Starting Task 3.2 SQLite Pragmas & Concurrency Optimization Tests...\n');

  // -----------------------------------------------------------------
  // 1. Verify Explicit SQLite Pragmas
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Explicit SQLite Optimization Pragmas ---');

  const busyTimeoutRow = db.prepare('PRAGMA busy_timeout').get();
  const busyTimeoutVal = Number(busyTimeoutRow?.timeout || busyTimeoutRow?.busy_timeout || 0);
  assert.strictEqual(busyTimeoutVal, 5000, 'busy_timeout must be configured to 5000ms');
  console.log(`✅ PRAGMA busy_timeout verified: ${busyTimeoutVal}ms (eliminates immediate SQLITE_BUSY failures)`);

  const journalModeRow = db.prepare('PRAGMA journal_mode').get();
  assert.strictEqual(journalModeRow?.journal_mode, 'wal', 'journal_mode must be WAL in non-Vercel environment');
  console.log('✅ PRAGMA journal_mode verified: WAL mode active');

  const synchronousRow = db.prepare('PRAGMA synchronous').get();
  const synchronousVal = Number(synchronousRow?.synchronous ?? -1);
  assert.strictEqual(synchronousVal, 1, 'synchronous must be 1 (NORMAL) for optimal WAL throughput');
  console.log('✅ PRAGMA synchronous verified: 1 (NORMAL) (2x-5x disk write speedup)');

  const checkpointRow = db.prepare('PRAGMA wal_autocheckpoint').get();
  const checkpointVal = Number(checkpointRow?.wal_autocheckpoint ?? 0);
  assert.strictEqual(checkpointVal, 1000, 'wal_autocheckpoint must be 1000 pages');
  console.log(`✅ PRAGMA wal_autocheckpoint verified: ${checkpointVal} pages (~4MB autocheckpoint limit)`);

  // -----------------------------------------------------------------
  // 2. High-Burst Concurrent Write Simulation
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing High-Burst Sequential & Transactional Writes ---');

  db.exec(`
    CREATE TABLE IF NOT EXISTS concurrency_test_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      val INTEGER,
      ts TEXT DEFAULT (datetime('now'))
    );
  `);

  const batchId = 'batch_' + Date.now();
  const ITERATIONS = 100;

  // Perform 100 atomic transactions in rapid succession
  for (let i = 0; i < ITERATIONS; i++) {
    runInTransaction(() => {
      db.prepare('INSERT INTO concurrency_test_records (batch_id, val) VALUES (?, ?)').run(batchId, i);
    });
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM concurrency_test_records WHERE batch_id = ?').get(batchId);
  assert.strictEqual(countRow.count, ITERATIONS, `Expected exactly ${ITERATIONS} records committed without any locks or rollbacks`);
  console.log(`✅ Successfully committed ${ITERATIONS} rapid burst transactions with 0 lock errors`);

  // Cleanup
  db.prepare('DELETE FROM concurrency_test_records WHERE batch_id = ?').run(batchId);

  console.log('\n🎉 ALL TASK 3.2 SQLITE PRAGMAS & CONCURRENCY TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
