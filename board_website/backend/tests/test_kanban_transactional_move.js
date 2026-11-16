process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const { db, move, runInTransaction } = require('../src/database/db');

async function testKanbanMove() {
  console.log('🧪 Starting Task 2.1 Kanban Reordering & Drag-to-Bottom Tests...\n');

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

  // Helper to fetch cards by stage and position
  const getCards = (user, stage) => {
    return db.prepare('SELECT id, company, stage, position FROM applications WHERE user_id = ? AND stage = ? ORDER BY position ASC, id DESC').all(user, stage);
  };

  // Create 5 cards for Alice in stage 'Applied': Card 0, 1, 2, 3, 4
  const aliceAppIds = [];
  for (let p = 0; p < 5; p++) {
    const res = db.prepare(`
      INSERT INTO applications (company, role, stage, position, user_id)
      VALUES (?, ?, 'Applied', ?, ?)
    `).run(`Company ${p}`, `Engineer ${p}`, p, userAlice);
    aliceAppIds.push(res.lastInsertRowid || db.prepare('SELECT last_insert_rowid() as id').get().id);
  }

  // Create 2 cards for Bob in stage 'Applied'
  const bobAppIds = [];
  for (let p = 0; p < 2; p++) {
    const res = db.prepare(`
      INSERT INTO applications (company, role, stage, position, user_id)
      VALUES (?, ?, 'Applied', ?, ?)
    `).run(`BobCompany ${p}`, `Designer ${p}`, p, userBob);
    bobAppIds.push(res.lastInsertRowid || db.prepare('SELECT last_insert_rowid() as id').get().id);
  }

  console.log('✅ Created initial test fixture: 5 cards for Alice, 2 cards for Bob in "Applied"');

  // -----------------------------------------------------------------
  // Test 1: Drag to Top within same column (before = first_card_id)
  // -----------------------------------------------------------------
  console.log('\n--- 1. Testing Drag-to-Top within same column ---');
  // Move card at index 3 to the very top (before card at index 0)
  const cardToTop = aliceAppIds[3];
  const firstCard = aliceAppIds[0];
  move(cardToTop, 'Applied', firstCard, userAlice);

  let cards = getCards(userAlice, 'Applied');
  assert.strictEqual(cards[0].id, cardToTop, 'Moved card must now be at index 0');
  assert.strictEqual(cards[1].id, firstCard, 'Original first card must now be at index 1');
  assert.deepStrictEqual(cards.map(c => c.position), [0, 1, 2, 3, 4], 'Positions must be contiguous [0, 1, 2, 3, 4]');
  console.log('✅ Drag-to-top placed card at position 0 with contiguous positions');

  // -----------------------------------------------------------------
  // Test 2: Drag Between Two Cards (before = middle_card_id)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Drag Between Two Cards ---');
  // Move the card currently at index 0 to between index 2 and index 3 (before cards[3].id)
  const currentFirst = cards[0].id;
  const targetBefore = cards[3].id;
  move(currentFirst, 'Applied', targetBefore, userAlice);

  cards = getCards(userAlice, 'Applied');
  assert.strictEqual(cards[2].id, currentFirst, 'Moved card must be placed at index 2');
  assert.strictEqual(cards[3].id, targetBefore, 'Target card must be right after moved card');
  assert.deepStrictEqual(cards.map(c => c.position), [0, 1, 2, 3, 4], 'Positions must remain contiguous [0, 1, 2, 3, 4]');
  console.log('✅ Drag between two cards correctly positioned in middle of column');

  // -----------------------------------------------------------------
  // Test 3: Drag to Bottom within same column (before = null) [THE BUG FIX]
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Drag-to-Bottom within same column (before = null) ---');
  // Move card at index 0 to the very bottom of 'Applied'
  const cardToBottom = cards[0].id;
  move(cardToBottom, 'Applied', null, userAlice);

  cards = getCards(userAlice, 'Applied');
  assert.strictEqual(cards[cards.length - 1].id, cardToBottom, 'Card dragged with before=null MUST end up at bottom of column');
  assert.strictEqual(cards[cards.length - 1].position, 4, 'Bottom card position must be 4');
  assert.notStrictEqual(cards[0].id, cardToBottom, 'Card must NOT snap to top index 0');
  assert.deepStrictEqual(cards.map(c => c.position), [0, 1, 2, 3, 4], 'Positions must remain contiguous [0, 1, 2, 3, 4]');
  console.log('✅ Drag-to-bottom bug verified fixed: card appended to bottom instead of snapping to top');

  // -----------------------------------------------------------------
  // Test 4: Cross-Column Stage Transition & Position Re-normalization
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Cross-Column Stage Transition ---');
  // Move card from 'Applied' to 'Interview' (drag to bottom of empty 'Interview')
  const moveAppId = cards[1].id;
  move(moveAppId, 'Interview', null, userAlice);

  const appliedCards = getCards(userAlice, 'Applied');
  const interviewCards = getCards(userAlice, 'Interview');

  assert.strictEqual(appliedCards.length, 4, 'Source stage should now have 4 cards');
  assert.deepStrictEqual(appliedCards.map(c => c.position), [0, 1, 2, 3], 'Source stage positions must be re-normalized to [0, 1, 2, 3]');

  assert.strictEqual(interviewCards.length, 1, 'Target stage should now have 1 card');
  assert.strictEqual(interviewCards[0].id, moveAppId, 'Target card must be the moved card');
  assert.strictEqual(interviewCards[0].position, 0, 'Target card in new stage must have position 0');

  // Move another card to 'Interview' at bottom (before = null)
  const secondMoveAppId = appliedCards[0].id;
  move(secondMoveAppId, 'Interview', null, userAlice);

  const interviewCardsAfter = getCards(userAlice, 'Interview');
  assert.strictEqual(interviewCardsAfter.length, 2, 'Target stage should now have 2 cards');
  assert.strictEqual(interviewCardsAfter[0].id, moveAppId, 'First moved card remains at pos 0');
  assert.strictEqual(interviewCardsAfter[1].id, secondMoveAppId, 'Second moved card appended to bottom at pos 1');
  assert.deepStrictEqual(interviewCardsAfter.map(c => c.position), [0, 1], 'Interview stage positions must be [0, 1]');

  // Verify activity logs
  const logs = db.prepare('SELECT type, detail FROM activity_log WHERE app_id = ? AND user_id = ?').all(secondMoveAppId, userAlice);
  assert.ok(logs.length >= 1, 'Activity log must be created on stage change');
  assert.strictEqual(logs[0].type, 'stage_change');
  console.log('✅ Cross-column move correctly re-normalized both source and target columns');

  // -----------------------------------------------------------------
  // Test 5: Cross-Tenant Move Isolation
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Cross-Tenant Move Isolation ---');
  const bobCardId = bobAppIds[0];
  // Alice attempts to move Bob's card
  move(bobCardId, 'Offer', null, userAlice);

  const bobCardAfter = db.prepare('SELECT stage, user_id FROM applications WHERE id = ?').get(bobCardId);
  assert.strictEqual(bobCardAfter.stage, 'Applied', 'Bob card must remain untouched');
  assert.strictEqual(bobCardAfter.user_id, userBob);
  console.log('✅ Cross-tenant move prevented completely');

  // -----------------------------------------------------------------
  // Test 6: Transaction Rollback on Error
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Atomic Rollback on Failure ---');
  const beforeSnapshot = getCards(userAlice, 'Applied');

  try {
    runInTransaction(() => {
      db.prepare('UPDATE applications SET position = 999 WHERE id = ?').run(appliedCards[0].id);
      throw new Error('Simulated network/DB crash in transaction');
    });
  } catch (err) {
    assert(err.message.includes('Simulated network/DB crash'));
  }

  const afterSnapshot = getCards(userAlice, 'Applied');
  assert.deepStrictEqual(afterSnapshot, beforeSnapshot, 'State must be completely rolled back after error');
  console.log('✅ Transaction rollback preserved state integrity');

  console.log('\n🎉 ALL TASK 2.1 KANBAN REORDERING & DRAG-TO-BOTTOM TESTS PASSED!\n');
  process.exit(0);
}

testKanbanMove().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
