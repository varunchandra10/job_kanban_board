const { db, runInTransaction } = require('../database/db');
const { calculateGamification, getDateInTimezone, shiftDays } = require('./learningsController');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

exports.getProgress = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.json([]);

    const rows = db.prepare(`
      SELECT problem_id, status, notes, repetition_stage, next_review_date, last_reviewed_at, updated_at 
      FROM dsa_progress 
      WHERE user_id = ?
    `).all(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.saveProgress = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });

    const { problem_id, status, notes, repetition_stage, next_review_date, last_reviewed_at, tz } = req.body;
    if (!problem_id) {
      return res.status(400).json({ error: 'problem_id is required' });
    }

    const cleanStatus = status || 'solved';
    const cleanNotes = notes !== undefined ? String(notes) : '';
    const userTz = tz || req.query.tz || null;
    const todayStr = getDateInTimezone(new Date(), userTz);

    if (cleanStatus === 'todo' && !cleanNotes) {
      db.prepare('DELETE FROM dsa_progress WHERE user_id = ? AND problem_id = ?').run(userId, problem_id);
    } else {
      const existing = db.prepare(`
        SELECT status, repetition_stage, next_review_date, last_reviewed_at 
        FROM dsa_progress 
        WHERE user_id = ? AND problem_id = ?
      `).get(userId, problem_id);

      let stage = repetition_stage !== undefined ? Number(repetition_stage) : (existing?.repetition_stage ?? 0);
      let nextReview = next_review_date !== undefined ? next_review_date : (existing?.next_review_date ?? null);
      let lastReviewed = last_reviewed_at !== undefined ? last_reviewed_at : (existing?.last_reviewed_at ?? null);

      if (cleanStatus === 'solved') {
        // If first time solved, or previously unsolved/missing review date, initialize Day 0 (Review 1 scheduled for tomorrow)
        if (!existing || existing.status !== 'solved' || (!nextReview && stage === 0)) {
          stage = 0;
          nextReview = shiftDays(todayStr, 1);
        }
      }

      runInTransaction(() => {
        db.prepare(`
          INSERT INTO dsa_progress (user_id, problem_id, status, notes, repetition_stage, next_review_date, last_reviewed_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(user_id, problem_id) DO UPDATE SET
            status = excluded.status,
            notes = excluded.notes,
            repetition_stage = excluded.repetition_stage,
            next_review_date = excluded.next_review_date,
            last_reviewed_at = excluded.last_reviewed_at,
            updated_at = datetime('now')
        `).run(userId, problem_id, cleanStatus, cleanNotes, stage, nextReview, lastReviewed);
      });
    }

    let gamification = null;
    try {
      gamification = calculateGamification(userId, userTz);
    } catch (_) {}

    res.json({ ok: 1, problem_id, status: cleanStatus, notes: cleanNotes, gamification });
  } catch (err) {
    next(err);
  }
};

exports.reviewProblem = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });

    const { problem_id, action = 'advance', tz } = req.body;
    if (!problem_id) {
      return res.status(400).json({ error: 'problem_id is required' });
    }

    const userTz = tz || req.query.tz || null;
    const todayStr = getDateInTimezone(new Date(), userTz);

    const existing = db.prepare(`
      SELECT status, notes, repetition_stage, next_review_date, last_reviewed_at 
      FROM dsa_progress 
      WHERE user_id = ? AND problem_id = ?
    `).get(userId, problem_id);

    if (!existing || existing.status !== 'solved') {
      return res.status(400).json({ error: 'Problem must be marked as solved before reviewing' });
    }

    const currentStage = Number(existing.repetition_stage || 0);
    let nextStage = currentStage;
    let nextReviewDate = null;
    const nowIso = new Date().toISOString();

    if (action === 'reset') {
      // User struggled: reset to Day 0, due for review tomorrow
      nextStage = 0;
      nextReviewDate = shiftDays(todayStr, 1);
    } else {
      // action === 'advance' (The 1-4-7 Rule)
      // Day 0 -> Review 1: Advances to Stage 1, due on Day 4 (+3 days)
      // Stage 1 -> Review 2: Advances to Stage 2, due on Day 7 (+3 days)
      // Stage 2 or 3 -> Review 3: Advances to Stage 4 (Permanently Mastered), no further review
      if (currentStage === 0) {
        nextStage = 1;
        nextReviewDate = shiftDays(todayStr, 3);
      } else if (currentStage === 1) {
        nextStage = 2;
        nextReviewDate = shiftDays(todayStr, 3);
      } else {
        nextStage = 4; // Permanently Mastered
        nextReviewDate = null;
      }
    }

    runInTransaction(() => {
      db.prepare(`
        UPDATE dsa_progress 
        SET repetition_stage = ?,
            next_review_date = ?,
            last_reviewed_at = ?,
            updated_at = datetime('now')
        WHERE user_id = ? AND problem_id = ?
      `).run(nextStage, nextReviewDate, nowIso, userId, problem_id);
    });

    let gamification = null;
    try {
      gamification = calculateGamification(userId, userTz);
    } catch (_) {}

    res.json({
      ok: 1,
      problem_id,
      repetition_stage: nextStage,
      next_review_date: nextReviewDate,
      last_reviewed_at: nowIso,
      gamification,
      earnedXP: action === 'advance' ? 15 : 0
    });
  } catch (err) {
    next(err);
  }
};
