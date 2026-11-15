process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const { db } = require('../src/database/db');
const dsaController = require('../src/controllers/dsaController');
const { shiftDays, getDateInTimezone } = require('../src/controllers/learningsController');

async function runTests() {
  console.log('🧪 Starting Task 2.2 DSA Spaced Repetition (1-4-7 Leitner) Validation Tests...\n');

  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS dsa_progress (
      user_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      notes TEXT DEFAULT '',
      repetition_stage INTEGER DEFAULT 0,
      next_review_date TEXT,
      last_reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, problem_id)
    );
  `);

  const testUserId = 'usr_dsa_leitner_tester';
  const tz = 'America/New_York';
  const todayStr = getDateInTimezone(new Date(), tz);

  // Clean fixture
  db.prepare('DELETE FROM dsa_progress WHERE user_id = ?').run(testUserId);

  const createMockRes = () => {
    return {
      statusCode: 200,
      jsonData: null,
      status(s) {
        this.statusCode = s;
        return this;
      },
      json(d) {
        this.jsonData = d;
        return this;
      }
    };
  };

  // -----------------------------------------------------------------
  // 1. Initial Solve: Initializes Day 0 (Review 1 scheduled for Day 1 / tomorrow)
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Initial Problem Solve (Day 0 -> Scheduled for Tomorrow) ---');
  const solveRes = createMockRes();
  dsaController.saveProgress({
    user: { id: testUserId },
    body: {
      problem_id: 'two-sum',
      status: 'solved',
      notes: 'Used hash map for O(n) lookup',
      tz
    }
  }, solveRes, (err) => { if (err) throw err; });

  assert.strictEqual(solveRes.statusCode, 200);
  assert.strictEqual(solveRes.jsonData.ok, 1);

  const row0 = db.prepare('SELECT * FROM dsa_progress WHERE user_id = ? AND problem_id = ?').get(testUserId, 'two-sum');
  assert.ok(row0, 'Record must exist in dsa_progress');
  assert.strictEqual(row0.status, 'solved');
  assert.strictEqual(row0.repetition_stage, 0, 'Stage must be 0 upon initial solve');
  const expectedReview1Date = shiftDays(todayStr, 1);
  assert.strictEqual(row0.next_review_date, expectedReview1Date, 'Next review date must be today + 1 day (tomorrow)');
  console.log(`✅ Problem solved: Stage 0 recorded, Review 1 scheduled for ${expectedReview1Date} (+1 day)`);

  // -----------------------------------------------------------------
  // 2. Review 1: Advances to Stage 1, Review 2 scheduled for Day 4 (+3 days)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Review 1: Advance to Stage 1 (+3 days -> Day 4) ---');
  const rev1Res = createMockRes();
  dsaController.reviewProblem({
    user: { id: testUserId },
    body: {
      problem_id: 'two-sum',
      action: 'advance',
      tz
    }
  }, rev1Res, (err) => { if (err) throw err; });

  assert.strictEqual(rev1Res.statusCode, 200);
  assert.strictEqual(rev1Res.jsonData.repetition_stage, 1, 'Must advance to Stage 1');
  assert.strictEqual(rev1Res.jsonData.earnedXP, 15, 'Advancing review must award 15 XP');

  const expectedReview2Date = shiftDays(todayStr, 3);
  assert.strictEqual(rev1Res.jsonData.next_review_date, expectedReview2Date, 'Next review date must be today + 3 days (Day 4)');

  const row1 = db.prepare('SELECT * FROM dsa_progress WHERE user_id = ? AND problem_id = ?').get(testUserId, 'two-sum');
  assert.strictEqual(row1.repetition_stage, 1);
  assert.strictEqual(row1.next_review_date, expectedReview2Date);
  console.log(`✅ Review 1 passed: Advanced to Stage 1, Review 2 scheduled for ${expectedReview2Date} (+3 days)`);

  // -----------------------------------------------------------------
  // 3. Review 2: Advances to Stage 2, Review 3 scheduled for Day 7 (+3 days)
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Review 2: Advance to Stage 2 (+3 days -> Day 7) ---');
  const rev2Res = createMockRes();
  dsaController.reviewProblem({
    user: { id: testUserId },
    body: {
      problem_id: 'two-sum',
      action: 'advance',
      tz
    }
  }, rev2Res, (err) => { if (err) throw err; });

  assert.strictEqual(rev2Res.statusCode, 200);
  assert.strictEqual(rev2Res.jsonData.repetition_stage, 2, 'Must advance to Stage 2');
  assert.strictEqual(rev2Res.jsonData.earnedXP, 15);

  const expectedReview3Date = shiftDays(todayStr, 3);
  assert.strictEqual(rev2Res.jsonData.next_review_date, expectedReview3Date, 'Next review date must be today + 3 days (Day 7)');

  const row2 = db.prepare('SELECT * FROM dsa_progress WHERE user_id = ? AND problem_id = ?').get(testUserId, 'two-sum');
  assert.strictEqual(row2.repetition_stage, 2);
  assert.strictEqual(row2.next_review_date, expectedReview3Date);
  console.log(`✅ Review 2 passed: Advanced to Stage 2, Review 3 scheduled for ${expectedReview3Date} (+3 days)`);

  // -----------------------------------------------------------------
  // 4. Review 3: Advances to Stage 4 (Permanently Mastered), Review cleared
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Review 3: Advance to Stage 4 (Mastered, no more reviews) ---');
  const rev3Res = createMockRes();
  dsaController.reviewProblem({
    user: { id: testUserId },
    body: {
      problem_id: 'two-sum',
      action: 'advance',
      tz
    }
  }, rev3Res, (err) => { if (err) throw err; });

  assert.strictEqual(rev3Res.statusCode, 200);
  assert.strictEqual(rev3Res.jsonData.repetition_stage, 4, 'Must advance to Stage 4 (Mastered)');
  assert.strictEqual(rev3Res.jsonData.next_review_date, null, 'Mastered problem must have null next_review_date');
  assert.strictEqual(rev3Res.jsonData.earnedXP, 15);

  const row3 = db.prepare('SELECT * FROM dsa_progress WHERE user_id = ? AND problem_id = ?').get(testUserId, 'two-sum');
  assert.strictEqual(row3.repetition_stage, 4);
  assert.strictEqual(row3.next_review_date, null);
  console.log('✅ Review 3 passed: Problem marked permanently Mastered (Stage 4), review date cleared');

  // -----------------------------------------------------------------
  // 5. Reset Action: User struggled -> falls back to Stage 0, Review 1 tomorrow
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Reset Action (User Struggled -> Back to Stage 0) ---');
  const resetRes = createMockRes();
  dsaController.reviewProblem({
    user: { id: testUserId },
    body: {
      problem_id: 'two-sum',
      action: 'reset',
      tz
    }
  }, resetRes, (err) => { if (err) throw err; });

  assert.strictEqual(resetRes.statusCode, 200);
  assert.strictEqual(resetRes.jsonData.repetition_stage, 0, 'Reset must reset stage back to 0');
  assert.strictEqual(resetRes.jsonData.next_review_date, expectedReview1Date, 'Reset must schedule review for tomorrow (+1 day)');
  assert.strictEqual(resetRes.jsonData.earnedXP, 0, 'Reset awards 0 XP');

  const rowReset = db.prepare('SELECT * FROM dsa_progress WHERE user_id = ? AND problem_id = ?').get(testUserId, 'two-sum');
  assert.strictEqual(rowReset.repetition_stage, 0);
  assert.strictEqual(rowReset.next_review_date, expectedReview1Date);
  console.log(`✅ Reset verified: Stage safely reverted to 0 with next review scheduled for tomorrow (${expectedReview1Date})`);

  // -----------------------------------------------------------------
  // 6. Reviewing Unsolved Problem is Rejected (HTTP 400)
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Review on Unsolved Problem Rejection ---');
  const unsolveRes = createMockRes();
  dsaController.reviewProblem({
    user: { id: testUserId },
    body: {
      problem_id: 'unsolved-hard-dp-problem',
      action: 'advance',
      tz
    }
  }, unsolveRes, (err) => { if (err) throw err; });

  assert.strictEqual(unsolveRes.statusCode, 400, 'Must return HTTP 400 when attempting to review unsolved problem');
  assert.ok(unsolveRes.jsonData.error.includes('must be marked as solved'));
  console.log('✅ Review attempt on unsolved problem rejected with HTTP 400');

  console.log('\n🎉 ALL TASK 2.2 DSA SPACED REPETITION (1-4-7 LEITNER) TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
