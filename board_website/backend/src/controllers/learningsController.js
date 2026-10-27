const { db } = require('../database/db');
const config = require('../config');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

function getTodayInTimezone(tz) {
  if (tz) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(new Date()); // YYYY-MM-DD
    } catch (_) {}
  }
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function shiftDays(dateStr, daysOffset) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysOffset);
  const yr = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const da = String(dt.getUTCDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function calculateGamification(userId = null, tz = null) {
  const todayStr = getTodayInTimezone(tz);

  if (!userId) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekPunchcard = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = shiftDays(todayStr, -i);
      const parts = dStr.split('-');
      const dayDate = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
      const dayName = dayNames[dayDate.getUTCDay()];
      weekPunchcard.push({
        date: dStr,
        day: dayName,
        active: false,
        frozen: false,
        appOnly: false,
        isToday: i === 0
      });
    }
    return {
      streak: 0,
      currentStreak: 0,
      longestStreak: 0,
      learningCount: 0,
      totalMinutes: 0,
      totalXP: 0,
      level: 1,
      title: 'Novice',
      levelTitle: 'Novice',
      currentLevelMin: 0,
      progressPercent: 0,
      nextLevelXP: 200,
      isFrozen: false,
      todayFrozen: false,
      todayCompleted: false,
      todayAppOnly: false,
      weekPunchcard
    };
  }

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

  // 2. Fetch total study minutes & learning count
  const logs = db.prepare(
    "SELECT date_logged, duration_minutes, topic FROM learnings WHERE user_id=?"
  ).all(userId);

  const learningCount = logs.length;
  const totalMinutes = logs.reduce((acc, l) => acc + (parseInt(l.duration_minutes, 10) || 0), 0);

  // 3. Compute Current Streak
  const todayCompleted = learningSet.has(todayStr) && appSet.has(todayStr);
  const todayFrozen = learningSet.has(todayStr) && !appSet.has(todayStr);
  const todayAppOnly = !learningSet.has(todayStr) && appSet.has(todayStr);

  let streak = 0;
  let checkDateStr = todayCompleted ? todayStr : shiftDays(todayStr, -1);

  while (true) {
    const hasLearning = learningSet.has(checkDateStr);
    const hasApp = appSet.has(checkDateStr);

    if (hasLearning && hasApp) {
      streak += 1;
      checkDateStr = shiftDays(checkDateStr, -1);
    } else if (hasLearning && !hasApp) {
      checkDateStr = shiftDays(checkDateStr, -1);
    } else {
      break;
    }
  }

  // 4. Compute Longest Streak
  const allDates = Array.from(new Set([...learningDates, ...appDates])).sort();
  let longestStreak = streak;
  let tempStreak = 0;
  for (let i = 0; i < allDates.length; i++) {
    const dStr = allDates[i];
    const prevDate = i > 0 ? allDates[i - 1] : null;
    const isConsecutive = prevDate && shiftDays(prevDate, 1) === dStr;

    if (learningSet.has(dStr) && appSet.has(dStr)) {
      tempStreak = isConsecutive ? tempStreak + 1 : 1;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else if (learningSet.has(dStr) && !appSet.has(dStr)) {
      // Frozen day maintains streak
      tempStreak = isConsecutive ? tempStreak : 0;
    } else {
      tempStreak = 0;
    }
  }

  // 5. Generate Week Punchcard (last 7 days ending today)
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekPunchcard = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = shiftDays(todayStr, -i);
    const [y, m, d] = dStr.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const hasLearning = learningSet.has(dStr);
    const hasApp = appSet.has(dStr);

    weekPunchcard.push({
      date: dStr,
      day: DAY_NAMES[dayOfWeek],
      active: hasLearning && hasApp,
      frozen: hasLearning && !hasApp,
      appOnly: !hasLearning && hasApp,
      isToday: dStr === todayStr
    });
  }

  // 6. Calculate XP & Levels
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
    longestStreak,
    learningCount,
    totalMinutes,
    totalXP,
    level: currentTier.level,
    title: currentTier.title,
    levelTitle: currentTier.title,
    currentLevelMin: currentTier.min,
    progressPercent,
    nextLevelXP: currentTier.max,
    isFrozen: todayFrozen && streak > 0,
    todayFrozen,
    todayCompleted,
    todayAppOnly,
    weekPunchcard
  };
}

exports.getLearnings = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
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
    const userId = getEffectiveUserId(req);
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
    const userId = getEffectiveUserId(req);
    if (!userId) return res.status(401).json({ error: 'Please log in' });
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM learnings WHERE id=? and user_id=?').get(id, userId);
    if (!existing) return res.status(404).json({ error: 'Learning not found' });

    const allowed = ['title', 'topic', 'category', 'date_logged', 'duration_minutes', 'notes', 'resource_url', 'tags'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'duration_minutes') {
          values.push(parseInt(req.body[key], 10) || 0);
        } else {
          values.push(req.body[key] === null ? null : String(req.body[key]));
        }
      }
    }

    if (updates.length > 0) {
      values.push(id, userId);
      db.prepare(`UPDATE learnings SET ${updates.join(', ')} WHERE id=? and user_id=?`).run(...values);
    }

    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteLearning = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
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
    const userId = getEffectiveUserId(req);
    const tz = req.query.tz || req.query.timezone || null;
    if (!userId) {
      return res.json({
        streak: 0,
        currentStreak: 0,
        longestStreak: 0,
        learningCount: 0,
        totalMinutes: 0,
        totalXP: 0,
        level: 1,
        title: 'Novice',
        levelTitle: 'Novice',
        currentLevelMin: 0,
        progressPercent: 0,
        nextLevelXP: 200,
        isFrozen: false,
        todayFrozen: false,
        todayCompleted: false,
        todayAppOnly: false,
        weekPunchcard: []
      });
    }
    const data = calculateGamification(userId, tz);
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
