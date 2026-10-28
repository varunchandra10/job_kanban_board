process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const { db, move, runInTransaction } = require('../src/database/db');

async function testKanbanMove() {
  console.log('🧪 Starting Task 8.2 Kanban Transactional Move & Multi-Tenant Tests...\n');

  // Ensure necessary tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT,
      role TEXT,
      stage TEXT DEFAULT 'Applied',
      position INTEGER DEFAULT 0,
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
  `);

  const userAlice = 'usr_kanban_alice';
  const userBob = 'usr_kanban_bob';

  // Cleanup test users from previous runs
  db.prepare('DELETE FROM applications WHERE user_id IN (?, ?)').run(userAlice, userBob);
  db.prepare('DELETE FROM activity_log WHERE user_id IN (?, ?)').run(userAlice, userBob);

  // 1. Create 10 applications in stage 'Applied' for Alice
  const aliceAppIds = [];
  for (let p = 0; p < 10; p++) {
    const res = db.prepare(`
      INSERT INTO applications (company, role, stage, position, user_id)
      VALUES (?, ?, 'Applied', ?, ?)
    `).run(`Company ${p}`, `Engineer ${p}`, p, userAlice);
    aliceAppIds.push(res.lastInsertRowid || db.prepare('SELECT last_insert_rowid() as id').get().id);
  }

  // 2. Create 3 applications in stage 'Applied' for Bob
  const bobAppIds = [];
  for (let p = 0; p < 3; p++) {
    const res = db.prepare(`
      INSERT INTO applications (company, role, stage, position, user_id)
      VALUES (?, ?, 'Applied', ?, ?)
    `).run(`BobCompany ${p}`, `Designer ${p}`, p, userBob);
    bobAppIds.push(res.lastInsertRowid || db.prepare('SELECT last_insert_rowid() as id').get().id);
  }

  console.log('✅ Created 10 cards for Alice and 3 cards for Bob in stage "Applied"');

  // --- Test 1: Reorder 10 items in a column for Alice ---
  console.log('\n--- 1. Testing Atomic Reordering within Column ---');
  // Move card index 8 (9th card) before card index 1 (2nd card)
  const targetCardId = aliceAppIds[8];
  const beforeCardId = aliceAppIds[1];

  move(targetCardId, 'Applied', beforeCardId, userAlice);

  // Retrieve Alice's cards sorted by position
  const aliceAfterMove = db.prepare('SELECT id, position FROM applications WHERE user_id = ? AND stage = ? ORDER BY position ASC').all(userAlice, 'Applied');
  assert.strictEqual(aliceAfterMove.length, 10, 'Alice should still have 10 cards in Applied');

  // Verify all positions are strictly 0..9 without any duplicate or skipped positions
  const positions = aliceAfterMove.map(a => a.position);
  assert.deepStrictEqual(positions, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'Positions must be strictly 0, 1, 2, ..., 9');

  // Verify the target card is now at index 1 (position 1)
  assert.strictEqual(aliceAfterMove[1].id, targetCardId, 'Moved card should now be at position 1');
  assert.strictEqual(aliceAfterMove[2].id, beforeCardId, 'Before card should now follow at position 2');

  // Verify Bob's positions were completely unaffected
  const bobAfterAliceMove = db.prepare('SELECT id, position FROM applications WHERE user_id = ? AND stage = ? ORDER BY position ASC').all(userBob, 'Applied');
  assert.strictEqual(bobAfterAliceMove.length, 3, 'Bob should still have 3 cards');
  assert.deepStrictEqual(bobAfterAliceMove.map(b => b.position), [0, 1, 2], 'Bob positions must remain intact');
  console.log('✅ 10 cards reordered atomically with strict contiguous position sequence; other user untouched');

  // --- Test 2: Move card to a new stage with activity log in transaction ---
  console.log('\n--- 2. Testing Stage Change with Transactional Activity Logging ---');
  const cardToInterview = aliceAppIds[0];
  move(cardToInterview, 'Interview', null, userAlice);

  const cardState = db.prepare('SELECT stage, position FROM applications WHERE id = ? AND user_id = ?').get(cardToInterview, userAlice);
  assert.strictEqual(cardState.stage, 'Interview');
  assert.strictEqual(cardState.position, 0);

  // Verify activity_log was recorded atomically for Alice
  const logs = db.prepare('SELECT app_id, type, detail, user_id FROM activity_log WHERE app_id = ? AND user_id = ?').all(cardToInterview, userAlice);
  assert.strictEqual(logs.length, 1, 'Exactly 1 activity log entry should be created');
  assert.strictEqual(logs[0].type, 'stage_change');
  assert.strictEqual(logs[0].user_id, userAlice);
  console.log('✅ Stage change and activity log persisted atomically in transaction');

  // --- Test 3: Cross-tenant move isolation (Alice cannot move Bob’s cards) ---
  console.log('\n--- 3. Testing Cross-Tenant Move Isolation ---');
  const bobCardId = bobAppIds[0];
  // Alice attempts to move Bob's card to Offer
  move(bobCardId, 'Offer', null, userAlice);

  const bobCardAfter = db.prepare('SELECT stage, user_id FROM applications WHERE id = ?').get(bobCardId);
  assert.strictEqual(bobCardAfter.stage, 'Applied', 'Bob card must remain in Applied; Alice move must be ignored');
  assert.strictEqual(bobCardAfter.user_id, userBob);

  const bobLogs = db.prepare('SELECT * FROM activity_log WHERE app_id = ?').all(bobCardId);
  assert.strictEqual(bobLogs.length, 0, 'No activity logs should be recorded for unauthorized move');
  console.log('✅ Cross-tenant move prevented completely');

  // --- Test 4: Transaction Rollback on Error ---
  console.log('\n--- 4. Testing Atomic Rollback on Failure ---');
  const beforeTxSnapshot = db.prepare('SELECT id, position FROM applications WHERE user_id = ? ORDER BY position ASC').all(userAlice);

  try {
    runInTransaction(() => {
      // Modify first card
      db.prepare('UPDATE applications SET position = 999 WHERE id = ?').run(aliceAppIds[0]);
      // Force an intentional failure
      throw new Error('Simulated network/DB crash in middle of reordering');
    });
  } catch (err) {
    assert(err.message.includes('Simulated network/DB crash'));
  }

  const afterTxSnapshot = db.prepare('SELECT id, position FROM applications WHERE user_id = ? ORDER BY position ASC').all(userAlice);
  assert.deepStrictEqual(afterTxSnapshot, beforeTxSnapshot, 'State must be completely rolled back after error');
  console.log('✅ Transaction rollback preserved state integrity without partial corruption');

  console.log('\n🎉 ALL TASK 8.2 KANBAN TRANSACTIONAL REORDERING TESTS PASSED!\n');
}

testKanbanMove().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

