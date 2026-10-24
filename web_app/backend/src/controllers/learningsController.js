const { db } = require('../database/db');

function calculateGamification(userId = null) {
  if (!userId) {
    return {
      streak: 0,
      currentStreak: 0,
      totalMinutes: 0,
      totalXP: 0,
      level: 1,
      levelTitle: 'Novice',
      progressPercent: 0,
      nextLevelXP: 200,
      isFrozen: false
    };
  }

  const now = new Date();
  const toDateStr = d => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const todayStr = toDateStr(now);

  // 1. Fetch user's distinct activity dates
  const learningRows = db.prepare(
    "SELECT distinct date_logged as d FROM learnings WHERE user_id=? AND date_logged IS NOT NULL AND date_logged != ''"
  ).all(userId);
  const learningDates = learningRows.map(r => r.d.slice(0, 10));
  const learningSet = new Set(learningDates);

  const appRows = db.prepare(
    "SELECT distinct substr(date_applied, 1, 10) as d FROM applications WHERE user_id=? AND date_applied IS NOT NULL"
  ).all(userId);
  const appDates = appRows.map(r => r.d);
  const appSet = new Set(appDates);

  // 2. Fetch total study minutes
  const logs = db.prepare(
    "SELECT date_logged, duration_minutes, topic FROM learnings WHERE user_id=?"
  ).all(userId);

  const totalMinutes = logs.reduce((acc, l) => acc + (parseInt(l.duration_minutes, 10) || 0), 0);

  // 3. Compute Streak
  let streak = 0;
  let checkDate = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  let todayCompleted = learningSet.has(todayStr) && appSet.has(todayStr);
  let todayFrozen = learningSet.has(todayStr) && !appSet.has(todayStr);

  if (!todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const ds = toDateStr(checkDate);
    const hasLearning = learningSet.has(ds);
    const hasApp = appSet.has(ds);

    if (hasLearning && hasApp) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (hasLearning && !hasApp) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 4. Calculate XP & Levels
  const baseLogXP = logs.length * 20;
  const timeXP = Math.floor(totalMinutes / 5) * 5;
  const streakBonusXP = streak * 50;
  const totalXP = baseLogXP + timeXP + streakBonusXP;

  const XP_THRESHOLDS = [
    { level: 1, title: 'Novice', min: 0, max: 200 },
    { level: 2, title: 'Apprentice', min: 200, max: 600 },
    { level: 3, title: 'Scholar', min: 600, max: 1200 },
    { level: 4, title: 'Practitioner', min: 1200, max: 2000 },
    { level: 5, title: 'Expert', min: 2000, max: 3200 },
    { level: 6, title: 'Master', min: 3200, max: 5000 },
    { level: 7, title: 'Grandmaster', min: 5000, max: 999999 }
  ];

  let currentTier = XP_THRESHOLDS[0];
  for (const t of XP_THRESHOLDS) {
    if (totalXP >= t.min) currentTier = t;
  }

  const range = currentTier.max - currentTier.min;
  const progressInTier = Math.max(0, totalXP - currentTier.min);
  const progressPercent = Math.min(100, Math.round((progressInTier / range) * 100));

  return {
    streak,
    currentStreak: streak,
    totalMinutes,
    totalXP,
    level: currentTier.level,
    levelTitle: currentTier.title,
    progressPercent,
    nextLevelXP: currentTier.max,
    isFrozen: todayFrozen && streak > 0,
    todayFrozen,
    todayCompleted
  };
}

exports.getLearnings = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.json([]);
    const rows = db.prepare(
      "SELECT * FROM learnings WHERE user_id=? ORDER BY date_logged DESC, id DESC"
    ).all(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createLearning = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const { title, topic, category, date_logged, duration_minutes, notes, resource_url, tags } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required for learning log' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const r = db.prepare(`
      INSERT INTO learnings (title, topic, category, date_logged, duration_minutes, notes, resource_url, tags, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      topic || 'General',
      category || 'Concept',
      date_logged || today,
      parseInt(duration_minutes, 10) || 0,
      notes || '',
      resource_url || '',
      tags || '',
      userId
    );

    const created = db.prepare('SELECT * FROM learnings WHERE id=?').get(r.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateLearning = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    const { title, topic, category, date_logged, duration_minutes, notes, resource_url, tags } = req.body;

    db.prepare(`
      UPDATE learnings
      SET title=?, topic=?, category=?, date_logged=?, duration_minutes=?, notes=?, resource_url=?, tags=?
      WHERE id=? and user_id=?
    `).run(
      title,
      topic,
      category,
      date_logged,
      parseInt(duration_minutes, 10) || 0,
      notes,
      resource_url,
      tags,
      id,
      userId
    );

    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteLearning = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    db.prepare('DELETE FROM learnings WHERE id=? and user_id=?').run(id, userId);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.getGamification = (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({
        streak: 0,
        currentStreak: 0,
        totalMinutes: 0,
        totalXP: 0,
        level: 1,
        levelTitle: 'Novice',
        progressPercent: 0,
        nextLevelXP: 200,
        isFrozen: false
      });
    }
    const data = calculateGamification(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGamificationStats: exports.getGamification,
  getLearnings: exports.getLearnings,
  createLearning: exports.createLearning,
  updateLearning: exports.updateLearning,
  deleteLearning: exports.deleteLearning,
  getGamification: exports.getGamification,
  calculateGamification
};
