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

function getDateInTimezone(dateInput, tz) {
  if (!dateInput) return null;
  try {
    const rawStr = String(dateInput).trim();
    // Append Z if missing timezone offset (e.g. SQLite datetime('now') is UTC: "2026-11-08 17:00:00")
    const isoStr = (!rawStr.endsWith('Z') && !rawStr.includes('+') && !rawStr.includes('-')) || rawStr.includes(' ')
      ? rawStr.replace(' ', 'T') + 'Z'
      : rawStr;
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return rawStr.slice(0, 10);
    if (tz) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(dt);
    }
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const da = String(dt.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  } catch (_) {
    return String(dateInput).slice(0, 10);
  }
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

const XP_THRESHOLDS = [
  { level: 1, title: 'Novice Scout', min: 0, max: 200, icon: 'Sprout' },
  { level: 2, title: 'Apprentice', min: 200, max: 600, icon: 'Zap' },
  { level: 3, title: 'Scholar', min: 600, max: 1200, icon: 'GraduationCap' },
  { level: 4, title: 'Practitioner', min: 1200, max: 2000, icon: 'Code2' },
  { level: 5, title: 'Expert', min: 2000, max: 3200, icon: 'Gem' },
  { level: 6, title: 'Master', min: 3200, max: 5000, icon: 'Crown' },
  { level: 7, title: 'Grandmaster', min: 5000, max: 999999, icon: 'Trophy' }
];

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
        isToday: i === 0,
        appCount: 0,
        studyMinutes: 0,
        dsaCount: 0
      });
    }
    return {
      streak: 0,
      currentStreak: 0,
      longestStreak: 0,
      learningCount: 0,
      totalMinutes: 0,
      totalDsaSolved: 0,
      totalXP: 0,
      level: 1,
      title: 'Novice Scout',
      levelTitle: 'Novice Scout',
      levelIcon: 'Sprout',
      currentLevelMin: 0,
      progressPercent: 0,
      nextLevelXP: 200,
      isFrozen: false,
      todayFrozen: false,
      todayCompleted: false,
      todayAppOnly: false,
      todayNeedsStudy: false,
      todayNeedsApp: false,
      todayMinutes: 0,
      todayDsaCount: 0,
      todayAppCount: 0,
      weekPunchcard,
      tiers: XP_THRESHOLDS
    };
  }

  // 1. Fetch user's applications grouped by date
  const appRows = db.prepare(
    "SELECT substr(date_applied, 1, 10) as d, count(*) as count FROM applications WHERE user_id=? AND date_applied IS NOT NULL GROUP BY substr(date_applied, 1, 10)"
  ).all(userId);
  const appsByDate = {};
  for (const r of appRows) {
    if (r.d) appsByDate[r.d] = r.count;
  }

  // 2. Fetch user's study logs and total study minutes
  const logs = db.prepare(
    "SELECT date_logged, duration_minutes, topic FROM learnings WHERE user_id=?"
  ).all(userId);

  let totalMinutes = 0;
  const studyMinutesByDate = {};
  for (const l of logs) {
    const mins = parseInt(l.duration_minutes, 10) || 0;
    totalMinutes += mins;
    if (l.date_logged) {
      const d = l.date_logged.slice(0, 10);
      studyMinutesByDate[d] = (studyMinutesByDate[d] || 0) + mins;
    }
  }

  // 3. Fetch user's solved DSA problems grouped by date & total solved
  let totalDsaSolved = 0;
  const dsaSolvedByDate = {};
  try {
    const allSolvedRows = db.prepare(
      "SELECT updated_at FROM dsa_progress WHERE user_id=? AND status='solved' AND updated_at IS NOT NULL"
    ).all(userId);
    totalDsaSolved = allSolvedRows.length;
    for (const r of allSolvedRows) {
      const d = getDateInTimezone(r.updated_at, tz) || (r.updated_at ? r.updated_at.slice(0, 10) : null);
      if (d) {
        dsaSolvedByDate[d] = (dsaSolvedByDate[d] || 0) + 1;
      }
    }
  } catch (_) {}

  // DSA counts under total learnings
  const learningCount = logs.length + totalDsaSolved;

  // Helper: A date is complete if user applied to >= 1 job AND/OR studied >= 45 min OR solved >= 1 DSA problem
  function isDayComplete(dStr) {
    const appCount = appsByDate[dStr] || 0;
    const mins = studyMinutesByDate[dStr] || 0;
    const dsaCount = dsaSolvedByDate[dStr] || 0;
    const hasApp = appCount >= 1;
    const hasStudy = mins >= 45 || dsaCount >= 1;
    return hasApp || hasStudy;
  }

  // 4. Compute Today's Status
  const todayAppCount = appsByDate[todayStr] || 0;
  const todayMinutes = studyMinutesByDate[todayStr] || 0;
  const todayDsaCount = dsaSolvedByDate[todayStr] || 0;

  const todayHasApp = todayAppCount >= 1;
  const todayHasStudy = todayMinutes >= 45 || todayDsaCount >= 1;

  const todayCompleted = todayHasApp || todayHasStudy;
  const todayAllQuestsDone = todayHasApp && todayHasStudy;
  const todayNeedsStudy = !todayHasStudy;
  const todayNeedsApp = !todayHasApp;
  const todayAppOnly = todayHasApp && !todayHasStudy;
  const todayFrozen = false;

  // 5. Compute Current Streak (Walking backwards day-by-day)
  let streak = 0;
  let checkDateStr = todayCompleted ? todayStr : shiftDays(todayStr, -1);

  while (true) {
    if (isDayComplete(checkDateStr)) {
      streak += 1;
      checkDateStr = shiftDays(checkDateStr, -1);
    } else {
      break;
    }
  }

  // 6. Compute Longest Streak
  const allActivityDates = Array.from(new Set([
    ...Object.keys(appsByDate),
    ...Object.keys(studyMinutesByDate),
    ...Object.keys(dsaSolvedByDate)
  ])).sort();

  let longestStreak = streak;
  let tempStreak = 0;
  let lastDate = null;

  for (const dStr of allActivityDates) {
    if (isDayComplete(dStr)) {
      if (lastDate && shiftDays(lastDate, 1) === dStr) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
      lastDate = dStr;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
      lastDate = null;
    }
  }

  // 7. Generate Week Punchcard (last 7 days ending today)
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekPunchcard = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = shiftDays(todayStr, -i);
    const [y, m, d] = dStr.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const dayApp = (appsByDate[dStr] || 0) >= 1;
    const dayStudy = (studyMinutesByDate[dStr] || 0) >= 45 || (dsaSolvedByDate[dStr] || 0) >= 1;
    const dayActive = dayApp && dayStudy;

    weekPunchcard.push({
      date: dStr,
      day: DAY_NAMES[dayOfWeek],
      active: dayActive,
      frozen: !dayApp && dayStudy,
      appOnly: dayApp && !dayStudy,
      isToday: dStr === todayStr,
      appCount: appsByDate[dStr] || 0,
      studyMinutes: studyMinutesByDate[dStr] || 0,
      dsaCount: dsaSolvedByDate[dStr] || 0
    });
  }

  // 8. Calculate XP & Levels
  const baseLogXP = logs.length * 20;
  const timeXP = Math.floor(totalMinutes / 5) * 5;
  const dsaXP = totalDsaSolved * 25;
  const streakBonusXP = streak * 50;
  const totalXP = baseLogXP + timeXP + dsaXP + streakBonusXP;

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
    totalDsaSolved,
    totalXP,
    level: currentTier.level,
    title: currentTier.title,
    levelTitle: currentTier.title,
    levelIcon: currentTier.icon,
    currentLevelMin: currentTier.min,
    progressPercent,
    nextLevelXP: currentTier.max,
    isFrozen: todayFrozen && streak > 0,
    todayFrozen,
    todayCompleted,
    todayAppOnly,
    todayNeedsStudy,
    todayNeedsApp,
    todayMinutes,
    todayDsaCount,
    todayAppCount,
    weekPunchcard,
    tiers: XP_THRESHOLDS
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
    if (userId && tz) {
      try {
        db.prepare('UPDATE users SET timezone=? WHERE id=? AND (timezone IS NULL OR timezone != ?)').run(tz, userId, tz);
      } catch (_) {}
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
