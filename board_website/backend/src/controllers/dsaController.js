const { db, runInTransaction } = require('../database/db');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

exports.getProgress = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.json([]);

    const rows = db.prepare('SELECT problem_id, status, notes, updated_at FROM dsa_progress WHERE user_id = ?').all(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.saveProgress = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });

    const { problem_id, status, notes } = req.body;
    if (!problem_id) {
      return res.status(400).json({ error: 'problem_id is required' });
    }

    const cleanStatus = status || 'solved';
    const cleanNotes = notes !== undefined ? String(notes) : '';

    if (cleanStatus === 'todo' && !cleanNotes) {
      db.prepare('DELETE FROM dsa_progress WHERE user_id = ? AND problem_id = ?').run(userId, problem_id);
      return res.json({ ok: 1, problem_id, status: 'todo', notes: '' });
    }

    runInTransaction(() => {
      db.prepare(`
        INSERT INTO dsa_progress (user_id, problem_id, status, notes, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, problem_id) DO UPDATE SET
          status = excluded.status,
          notes = excluded.notes,
          updated_at = datetime('now')
      `).run(userId, problem_id, cleanStatus, cleanNotes);
    });

    res.json({ ok: 1, problem_id, status: cleanStatus, notes: cleanNotes });
  } catch (err) {
    next(err);
  }
};

