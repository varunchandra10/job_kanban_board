const { db } = require('../database/db');

// Calculate Gamification XP, Streak, and Levels
function calculateGamification() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // 1. Gather all activity dates
  const learningDates = db.prepare("SELECT date_logged as dt FROM learnings WHERE date_logged IS NOT NULL AND date_logged != ''").all().map(r => r.dt.slice(0, 10));
  const appDates = db.prepare("SELECT date_applied as dt FROM applications WHERE date_applied IS NOT NULL AND date_applied != ''").all().map(r => r.dt.slice(0, 10));
  const logDates = db.prepare("SELECT date(ts) as dt FROM activity_log WHERE ts IS NOT NULL").all().map(r => r.dt);

  const allDatesSet = new Set([...learningDates, ...appDates, ...logDates]);
  const sortedDates = Array.from(allDatesSet).sort().reverse();

  // 2. Compute current streak
  let currentStreak = 0;
  let checkDate = new Date();
  const todayStr = checkDate.toISOString().slice(0, 10);
  const todayLogged = allDatesSet.has(todayStr);

  if (todayLogged) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (allDatesSet.has(yesterday)) {
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    currentStreak = 0;
  }

  if (currentStreak > 0 || allDatesSet.has(yesterday)) {
    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (allDatesSet.has(dStr)) {
        if (!todayLogged && currentStreak === 0) {
          currentStreak = 1;
        } else if (dStr !== todayStr) {
          currentStreak++;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 3. Compute Longest Streak
  let longestStreak = currentStreak;
  const ascDates = Array.from(allDatesSet).sort();
  if (ascDates.length > 0) {
    let tempStreak = 1;
    for (let i = 1; i < ascDates.length; i++) {
      const prev = new Date(ascDates[i - 1]);
      const curr = new Date(ascDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
  }

  // 4. Calculate Total XP
  const appCount = db.prepare("SELECT count(1) as c FROM applications").get().c;
  const learningCount = db.prepare("SELECT count(1) as c FROM learnings").get().c;
  const totalMinutes = db.prepare("SELECT coalesce(sum(duration_minutes), 0) as m FROM learnings").get().m;
  const stageMoves = db.prepare("SELECT count(1) as c FROM activity_log WHERE type='stage_change'").get().c;

  let totalXP = (appCount * 100) + (learningCount * 50) + (Math.floor(totalMinutes / 30) * 20) + (stageMoves * 50) + (currentStreak * 25);

  // 5. Level Tiers
  const levels = [
    { level: 1, title: 'Novice Seeker', minXP: 0, nextXP: 300 },
    { level: 2, title: 'Skill Apprentice', minXP: 300, nextXP: 750 },
    { level: 3, title: 'Focused Builder', minXP: 750, nextXP: 1400 },
    { level: 4, title: 'Knowledge Hunter', minXP: 1400, nextXP: 2300 },
    { level: 5, title: 'Consistent Master', minXP: 2300, nextXP: 3500 },
    { level: 6, title: 'Legendary Architect', minXP: 3500, nextXP: 5000 },
  ];

  let userLevel = levels[0];
  for (const lvl of levels) {
    if (totalXP >= lvl.minXP) {
      userLevel = lvl;
    }
  }

  const currentLevelMin = userLevel.minXP;
  const nextLevelXP = userLevel.nextXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round(((totalXP - currentLevelMin) / (nextLevelXP - currentLevelMin)) * 100)));

  // 6. Last 7 Days Punchcard
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekPunchcard = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    weekPunchcard.push({
      date: dStr,
      day: dayNames[d.getDay()],
      active: allDatesSet.has(dStr),
      isToday: dStr === todayStr
    });
  }

  return {
    streak: currentStreak,
    longestStreak,
    totalXP,
    level: userLevel.level,
    title: userLevel.title,
    progressPercent,
    currentLevelMin,
    nextLevelXP,
    todayCompleted: todayLogged,
    learningCount,
    appCount,
    totalMinutes,
    weekPunchcard
  };
}

exports.getLearnings = (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM learnings ORDER BY date_logged DESC, id DESC").all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createLearning = (req, res, next) => {
  try {
    const { title, topic, category, date_logged, duration_minutes, notes, resource_url, tags } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required for learning log' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const r = db.prepare(`
      INSERT INTO learnings (title, topic, category, date_logged, duration_minutes, notes, resource_url, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(),
      topic || '',
      category || 'General',
      date_logged || today,
      parseInt(duration_minutes || '30', 10),
      notes || '',
      resource_url || '',
      tags || ''
    );

    const created = db.prepare("SELECT * FROM learnings WHERE id=?").get(Number(r.lastInsertRowid));
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateLearning = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['title', 'topic', 'category', 'date_logged', 'duration_minutes', 'notes', 'resource_url', 'tags'];
    const keys = Object.keys(req.body).filter(k => allowed.includes(k));
    if (keys.length > 0) {
      db.prepare(`UPDATE learnings SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`).run(
        ...keys.map(k => req.body[k]),
        id
      );
    }
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.deleteLearning = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare("DELETE FROM learnings WHERE id=?").run(id);
    res.json({ ok: 1 });
  } catch (err) {
    next(err);
  }
};

exports.getGamificationStats = (req, res, next) => {
  try {
    const stats = calculateGamification();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
