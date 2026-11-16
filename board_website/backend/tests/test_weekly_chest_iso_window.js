process.env.TURSO_DATABASE_URL = '';
process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';

const assert = require('assert');
const { db } = require('../src/database/db');
const weeklyChestController = require('../src/controllers/weeklyChestController');
const { getIsoWeekWindow } = weeklyChestController;

async function runTests() {
  console.log('🧪 Starting Task 2.3 Weekly Chest ISO 8601 & Timezone Boundary Tests...\n');

  // Ensure necessary tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_chests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      week_id TEXT NOT NULL,
      target_apps INTEGER DEFAULT 10,
      target_dsa INTEGER DEFAULT 5,
      target_study_minutes INTEGER DEFAULT 180,
      current_apps INTEGER DEFAULT 0,
      current_dsa INTEGER DEFAULT 0,
      current_study_minutes INTEGER DEFAULT 0,
      is_claimed INTEGER DEFAULT 0,
      claimed_at TEXT,
      bonus_xp_awarded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, week_id)
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT,
      role TEXT,
      stage TEXT DEFAULT 'Applied',
      position INTEGER DEFAULT 0,
      date_applied TEXT,
      user_id TEXT DEFAULT 'default_user',
      created_at TEXT DEFAULT (datetime('now'))
    );
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
    CREATE TABLE IF NOT EXISTS learnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      topic TEXT,
      duration_minutes INTEGER DEFAULT 0,
      date_logged TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // -----------------------------------------------------------------
  // 1. December 31 / January 1 Year Turnover (ISO 8601 Compliance)
  // -----------------------------------------------------------------
  console.log('--- 1. Testing ISO 8601 Year Boundary Rollovers ---');

  // Case A: 2025-12-31 is Wednesday. Thursday of this week is 2026-01-01.
  // Standard ISO 8601 requires this week to be labeled 2026-W01.
  const winA = getIsoWeekWindow(new Date('2025-12-31T12:00:00Z'));
  assert.strictEqual(winA.weekId, '2026-W01', '2025-12-31 must belong to 2026-W01 because Thursday is 2026-01-01');
  assert.strictEqual(winA.mondayStr, '2025-12-29', 'Monday must start on 2025-12-29');
  assert.strictEqual(winA.sundayStr, '2026-01-04', 'Sunday must end on 2026-01-04');
  console.log('✅ 2025-12-31 correctly mapped to 2026-W01 (Thursday determines ISO year)');

  // Case B: 2026-01-01 is Thursday. Must also belong to 2026-W01.
  const winB = getIsoWeekWindow(new Date('2026-01-01T12:00:00Z'));
  assert.strictEqual(winB.weekId, '2026-W01');
  assert.strictEqual(winB.mondayStr, '2025-12-29');
  assert.strictEqual(winB.sundayStr, '2026-01-04');
  console.log('✅ 2026-01-01 correctly mapped to 2026-W01');

  // Case C: 2023-01-01 is Sunday. Thursday was 2022-12-29.
  // Must belong to 2022-W52!
  const winC = getIsoWeekWindow(new Date('2023-01-01T12:00:00Z'));
  assert.strictEqual(winC.weekId, '2022-W52', '2023-01-01 (Sunday) must belong to 2022-W52');
  assert.strictEqual(winC.mondayStr, '2022-12-26');
  assert.strictEqual(winC.sundayStr, '2023-01-01');
  console.log('✅ 2023-01-01 correctly mapped to 2022-W52 (previous year week 52)');

  // Case D: Leap Day 2024-02-29
  const winD = getIsoWeekWindow(new Date('2024-02-29T12:00:00Z'));
  assert.strictEqual(winD.weekId, '2024-W09');
  assert.strictEqual(winD.mondayStr, '2024-02-26');
  assert.strictEqual(winD.sundayStr, '2024-03-03');
  console.log('✅ Leap day 2024-02-29 correctly mapped to 2024-W09');

  // -----------------------------------------------------------------
  // 2. Non-standard Fractional Timezone Boundary Handling
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Non-Standard Timezone Boundary Shifts ---');

  // Time: Sunday 20:00:00 UTC (2026-11-15T20:00:00Z)
  // In UTC, this is Sunday (2026-11-15) -> belonging to the week ending 2026-11-15.
  // In Asia/Kolkata (UTC+05:30), this is Monday 01:30:00 AM (2026-11-16) -> belonging to the new week!
  const utcDate = new Date('2026-11-15T20:00:00Z');

  const winUtc = getIsoWeekWindow(utcDate, 'UTC');
  const winIst = getIsoWeekWindow(utcDate, 'Asia/Kolkata');

  assert.strictEqual(winUtc.mondayStr, '2026-11-09', 'UTC sees Sunday 2026-11-15 as end of current week');
  assert.strictEqual(winUtc.sundayStr, '2026-11-15');

  assert.strictEqual(winIst.mondayStr, '2026-11-16', 'Asia/Kolkata (+05:30) correctly sees Monday 2026-11-16 as start of next week');
  assert.strictEqual(winIst.sundayStr, '2026-11-22');
  console.log('✅ Asia/Kolkata (+05:30) midnight boundary transition correctly advances to next ISO week');

  // -----------------------------------------------------------------
  // 3. Weekly Quest Claiming & Idempotence
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Quest Completion Verification & Claim Idempotence ---');

  const testUser = 'usr_weekly_chest_tester';
  const tz = 'Asia/Kolkata';
  const currentWeek = getIsoWeekWindow(new Date(), tz);
  const weekId = currentWeek.weekId;

  // Clean fixture
  db.prepare('DELETE FROM weekly_chests WHERE user_id = ?').run(testUser);
  db.prepare('DELETE FROM applications WHERE user_id = ?').run(testUser);
  db.prepare('DELETE FROM dsa_progress WHERE user_id = ?').run(testUser);
  db.prepare('DELETE FROM learnings WHERE user_id = ?').run(testUser);

  // Setup chest with low targets for deterministic testing: 2 apps, 1 dsa, 30 min study
  db.prepare(`
    INSERT INTO weekly_chests (user_id, week_id, target_apps, target_dsa, target_study_minutes, is_claimed)
    VALUES (?, ?, 2, 1, 30, 0)
  `).run(testUser, weekId);

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

  // Case A: Attempt claim when requirements are incomplete (0 apps, 0 dsa, 0 mins)
  const failClaimRes = createMockRes();
  weeklyChestController.claimChest({
    user: { id: testUser },
    body: { tz }
  }, failClaimRes, (err) => { if (err) throw err; });

  assert.strictEqual(failClaimRes.statusCode, 400, 'Must reject incomplete quests with HTTP 400');
  assert.ok(failClaimRes.jsonData.error.includes('100% completion'), 'Expected 100% completion error message');
  console.log('✅ Incomplete quest claim rejected with HTTP 400');

  // Fulfill requirements
  const todayDateStr = currentWeek.mondayStr; // Safe date within current week window
  // 1. Submit 2 applications
  db.prepare("INSERT INTO applications (company, role, stage, date_applied, user_id) VALUES (?, ?, 'Applied', ?, ?)").run('Google', 'L5 SWE', todayDateStr, testUser);
  db.prepare("INSERT INTO applications (company, role, stage, date_applied, user_id) VALUES (?, ?, 'Applied', ?, ?)").run('Anthropic', 'Research Eng', todayDateStr, testUser);

  // 2. Solve 1 DSA problem
  db.prepare("INSERT INTO dsa_progress (user_id, problem_id, status, repetition_stage, updated_at) VALUES (?, 'lru-cache', 'solved', 1, ?)").run(testUser, todayDateStr + ' 10:00:00');

  // 3. Log 35 minutes study
  db.prepare("INSERT INTO learnings (user_id, title, topic, duration_minutes, date_logged) VALUES (?, ?, ?, ?, ?)").run(testUser, 'System Design Deep Dive', 'System Design', 35, todayDateStr);

  // Case B: Successful Claim (100% reached)
  const successClaimRes = createMockRes();
  weeklyChestController.claimChest({
    user: { id: testUser },
    body: { tz }
  }, successClaimRes, (err) => { if (err) throw err; });

  assert.strictEqual(successClaimRes.statusCode, 200, 'Must claim successfully with HTTP 200');
  assert.strictEqual(successClaimRes.jsonData.ok, 1);
  assert.strictEqual(successClaimRes.jsonData.bonusXp, 100, 'Must award exactly +100 Bonus XP');
  assert.strictEqual(successClaimRes.jsonData.weekId, weekId);

  const claimedChest = db.prepare('SELECT is_claimed, bonus_xp_awarded FROM weekly_chests WHERE user_id = ? AND week_id = ?').get(testUser, weekId);
  assert.strictEqual(claimedChest.is_claimed, 1, 'Database must record is_claimed = 1');
  assert.strictEqual(claimedChest.bonus_xp_awarded, 100, 'Database must record bonus_xp_awarded = 100');
  console.log('✅ 100% completed quest successfully claimed: awarded +100 Bonus XP');

  // Case C: Idempotent Double-Claim Prevention (Attempt claim again in same week)
  const duplicateClaimRes = createMockRes();
  weeklyChestController.claimChest({
    user: { id: testUser },
    body: { tz }
  }, duplicateClaimRes, (err) => { if (err) throw err; });

  assert.strictEqual(duplicateClaimRes.statusCode, 400, 'Must reject duplicate claim with HTTP 400');
  assert.ok(duplicateClaimRes.jsonData.error.includes('already been claimed'), 'Expected already claimed error message');

  const finalChestCheck = db.prepare('SELECT is_claimed, bonus_xp_awarded FROM weekly_chests WHERE user_id = ? AND week_id = ?').get(testUser, weekId);
  assert.strictEqual(finalChestCheck.bonus_xp_awarded, 100, 'Bonus XP must remain exactly 100, never duplicated');
  console.log('✅ Duplicate claim rejected with HTTP 400; Bonus XP cannot be exploited');

  console.log('\n🎉 ALL TASK 2.3 WEEKLY CHEST ISO 8601 & TIMEZONE TESTS PASSED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
