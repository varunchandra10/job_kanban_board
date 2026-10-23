const { db } = require('../database/db');

// Calculate Gamification XP, Streak, and Levels
//
// Streak Rules:
//   - A day COUNTS (increments streak) only when the user did BOTH: added a learning AND added an application
//   - If user misses application but adds learning -> streak is FROZEN (held/paused, no increment, no break)
//   - If user adds application but misses learning -> BREAK the streak
//   - If user misses both application + learning -> BREAK the streak
//   - Today is in-progress: if today is not completed yet, prior streak through yesterday remains active/frozen
function calculateGamification() {
  const now = new Date();
  const toDateStr = d => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const todayStr = toDateStr(now);

  // 1. Gather activity dates from DB
  const learningDates = db.prepare(`
    SELECT coalesce(nullif(date_logged, ''), substr(created_at, 1, 10)) as dt 
    FROM learnings 
    WHERE (date_logged IS NOT NULL AND date_logged != '') OR created_at IS NOT NULL
  `).all().map(r => r.dt ? r.dt.slice(0, 10) : null).filter(Boolean);

  const appDates = db.prepare(`
    SELECT date_applied as dt 
    FROM applications 
    WHERE date_applied IS NOT NULL AND date_applied != ''
  `).all().map(r => r.dt ? r.dt.slice(0, 10) : null).filter(Boolean);

  const learningSet = new Set(learningDates);
  const appSet = new Set(appDates);

  // 2. Classify day type according to streak rules:
  //    'both'     -> both app + learning -> streak increments
  //    'frozen'   -> only learning, no app -> streak freezes (pauses, no break, no increment)
  //    'app_only' -> only app, no learning -> break streak
  //    'neither'  -> neither app nor learning -> break streak
  function getDayType(dateStr) {
    const hasApp = appSet.has(dateStr);
    const hasLearn = learningSet.has(dateStr);
    if (hasApp && hasLearn) return 'both';
    if (hasLearn && !hasApp) return 'frozen';
    if (hasApp && !hasLearn) return 'app_only';
    return 'neither';
  }

  // 3. Compute Current Streak
  // Check Today's status:
  const todayType = getDayType(todayStr);
  let currentStreak = 0;
  let isFrozen = false;
  let streakHasActiveDay = false;

  if (todayType === 'both') {
    currentStreak = 1;
    streakHasActiveDay = true;
  } else if (todayType === 'frozen') {
    isFrozen = true;
  }

  // Walk backwards from yesterday
  const walkDate = new Date(now.getTime());
  for (let i = 1; i <= 365; i++) {
    walkDate.setDate(walkDate.getDate() - 1);
    const dStr = toDateStr(walkDate);
    const type = getDayType(dStr);

    if (type === 'both') {
      currentStreak++;
      streakHasActiveDay = true;
    } else if (type === 'frozen') {
      // Frozen pauses: no increment, no break!
      if (i === 1 && todayType !== 'both') {
        isFrozen = true;
      }
    } else {
      // type is 'app_only' or 'neither' -> streak walk stops here
      break;
    }
  }

  // If user had purely frozen days with 0 'both' days, streak is 0
  if (!streakHasActiveDay && currentStreak === 0) {
    isFrozen = (todayType === 'frozen');
  }

  // Also compute learning streak (consecutive days adding learnings)
  let learningStreak = learningSet.has(todayStr) ? 1 : 0;
  const lWalkDate = new Date(now.getTime());
  for (let i = 1; i <= 365; i++) {
    lWalkDate.setDate(lWalkDate.getDate() - 1);
    const dStr = toDateStr(lWalkDate);
    if (learningSet.has(dStr)) {
      learningStreak++;
    } else {
      break;
    }
  }

  // 4. Compute Longest Streak (historical best)
  const allDatesSet = new Set([...learningDates, ...appDates]);
  const ascDates = Array.from(allDatesSet).sort();

  let longestStreak = currentStreak;
  if (ascDates.length > 0) {
    const start = new Date(ascDates[0] + 'T00:00:00');
    const end = new Date(todayStr + 'T00:00:00');
    let tempStreak = 0;
    const cur = new Date(start.getTime());

    while (cur <= end) {
      const dStr = toDateStr(cur);
      const type = getDayType(dStr);

      if (type === 'both') {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else if (type === 'frozen') {
        // Pauses: does not reset tempStreak, does not increment
      } else {
        tempStreak = 0;
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  // 5. Calculate Total XP
  const appCount = db.prepare("SELECT count(1) as c FROM applications").get().c;
  const learningCount = db.prepare("SELECT count(1) as c FROM learnings").get().c;
  const totalMinutes = db.prepare("SELECT coalesce(sum(duration_minutes), 0) as m FROM learnings").get().m;
  const stageMoves = db.prepare("SELECT count(1) as c FROM activity_log WHERE type='stage_change'").get().c;

  let totalXP = (appCount * 100) + (learningCount * 50) + (Math.floor(totalMinutes / 30) * 20) + (stageMoves * 50) + (currentStreak * 25);

  // 6. Level Tiers
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

  // 7. Last 7 Days Punchcard
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekPunchcard = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i);
    const dStr = toDateStr(d);
    const dayType = getDayType(dStr);
    weekPunchcard.push({
      date: dStr,
      day: dayNames[d.getDay()],
      type: dayType,
      active: dayType === 'both',
      frozen: dayType === 'frozen',
      appOnly: dayType === 'app_only',
      isToday: dStr === todayStr
    });
  }

  return {
    streak: currentStreak,
    applicationStreak: currentStreak,
    learningStreak,
    longestStreak,
    isFrozen,
    totalXP,
    level: userLevel.level,
    title: userLevel.title,
    progressPercent,
    currentLevelMin,
    nextLevelXP,
    todayCompleted: todayType === 'both',
    todayFrozen: todayType === 'frozen',
    todayAppOnly: todayType === 'app_only',
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
