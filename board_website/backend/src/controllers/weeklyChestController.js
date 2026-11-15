const { db, runInTransaction } = require('../database/db');
const { calculateGamification, getDateInTimezone } = require('./learningsController');

function getEffectiveUserId(req) {
  return req.user?.id || null;
}

/**
 * Calculates Monday–Sunday window and ISO week identifier (YYYY-Www)
 */
function getIsoWeekWindow(dateInput = new Date(), tz = null) {
  // If timezone is provided, derive date string in that timezone
  let baseDate;
  if (tz) {
    try {
      const dateStr = getDateInTimezone(dateInput, tz);
      const [y, m, d] = dateStr.split('-').map(Number);
      baseDate = new Date(Date.UTC(y, m - 1, d));
    } catch (_) {
      baseDate = new Date(dateInput);
    }
  } else {
    baseDate = new Date(dateInput);
  }

  const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()));
  const dayOfWeek = d.getUTCDay() || 7; // 1 = Monday, 7 = Sunday

  // Monday of the current week
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dayOfWeek + 1);
  monday.setUTCHours(0, 0, 0, 0);

  // Sunday of the current week
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  // ISO Week Number (Thursday in current week determines year)
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  const weekId = `${thursday.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  return {
    weekId,
    weekNo,
    year: thursday.getUTCFullYear(),
    mondayStr,
    sundayStr,
    mondayIso: monday.toISOString(),
    sundayIso: sunday.toISOString(),
  };
}

/**
 * Computes live weekly quest progress directly from user activity logs
 */
function calculateLiveWeeklyMetrics(userId, mondayStr, sundayStr) {
  if (!userId) {
    return { current_apps: 0, current_dsa: 0, current_study_minutes: 0 };
  }

  // 1. Applications submitted in this Monday–Sunday window
  const appsRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM applications 
    WHERE user_id = ? 
      AND (
        (date_applied IS NOT NULL AND date_applied != '' AND date_applied >= ? AND date_applied <= ?)
        OR
        ((date_applied IS NULL OR date_applied = '') AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?)
      )
  `).get(userId, mondayStr, sundayStr, mondayStr, sundayStr);

  // 2. DSA problems solved in this Monday–Sunday window
  const dsaRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM dsa_progress 
    WHERE user_id = ? 
      AND status = 'solved' 
      AND substr(updated_at, 1, 10) >= ? 
      AND substr(updated_at, 1, 10) <= ?
  `).get(userId, mondayStr, sundayStr);

  // 3. Technical deep study minutes logged in this Monday–Sunday window
  const studyRow = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes 
    FROM learnings 
    WHERE user_id = ? 
      AND (
        (date_logged IS NOT NULL AND date_logged != '' AND date_logged >= ? AND date_logged <= ?)
        OR
        ((date_logged IS NULL OR date_logged = '') AND substr(created_at, 1, 10) >= ? AND substr(created_at, 1, 10) <= ?)
      )
  `).get(userId, mondayStr, sundayStr, mondayStr, sundayStr);

  return {
    current_apps: appsRow?.count || 0,
    current_dsa: dsaRow?.count || 0,
    current_study_minutes: studyRow?.total_minutes || 0,
  };
}

/**
 * GET /api/weekly-chest/current
 * Calculates live progress across current Monday–Sunday window
 */
exports.getCurrentChest = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    const tz = req.user?.timezone || req.query.tz || 'Asia/Kolkata';
    const { weekId, mondayStr, sundayStr } = getIsoWeekWindow(new Date(), tz);

    if (!userId) {
      // Unauthenticated / guest state: return default blueprint
      return res.json({
        weekId,
        mondayDate: mondayStr,
        sundayDate: sundayStr,
        targets: { apps: 10, dsa: 5, studyMinutes: 180 },
        progress: { apps: 0, dsa: 0, studyMinutes: 0 },
        percentages: { apps: 0, dsa: 0, study: 0, overall: 0 },
        isUnlocked: false,
        isClaimed: false,
        claimedAt: null,
        bonusXpAwarded: 0,
      });
    }

    // 1. Fetch existing chest record for this user and week
    let chest = db.prepare(`
      SELECT * FROM weekly_chests 
      WHERE user_id = ? AND week_id = ?
    `).get(userId, weekId);

    // 2. Compute live metrics
    const liveMetrics = calculateLiveWeeklyMetrics(userId, mondayStr, sundayStr);

    if (!chest) {
      // Check user custom target defaults from settings
      let targetApps = 10;
      let targetDsa = 5;
      let targetStudyMinutes = 180;

      try {
        const settingsRows = db.prepare(`
          SELECT key, value FROM settings 
          WHERE user_id = ? AND key IN ('weekly_chest_target_apps', 'weekly_chest_target_dsa', 'weekly_chest_target_study_minutes')
        `).all(userId);

        settingsRows.forEach(r => {
          if (r.key === 'weekly_chest_target_apps' && Number(r.value) > 0) targetApps = Number(r.value);
          if (r.key === 'weekly_chest_target_dsa' && Number(r.value) > 0) targetDsa = Number(r.value);
          if (r.key === 'weekly_chest_target_study_minutes' && Number(r.value) > 0) targetStudyMinutes = Number(r.value);
        });
      } catch (_) {}

      db.prepare(`
        INSERT INTO weekly_chests (
          user_id, week_id, target_apps, target_dsa, target_study_minutes,
          current_apps, current_dsa, current_study_minutes, is_claimed, bonus_xp_awarded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `).run(
        userId,
        weekId,
        targetApps,
        targetDsa,
        targetStudyMinutes,
        liveMetrics.current_apps,
        liveMetrics.current_dsa,
        liveMetrics.current_study_minutes
      );

      chest = db.prepare(`
        SELECT * FROM weekly_chests 
        WHERE user_id = ? AND week_id = ?
      `).get(userId, weekId);
    } else {
      // Update with latest live progress
      db.prepare(`
        UPDATE weekly_chests 
        SET current_apps = ?, current_dsa = ?, current_study_minutes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        liveMetrics.current_apps,
        liveMetrics.current_dsa,
        liveMetrics.current_study_minutes,
        chest.id
      );

      chest.current_apps = liveMetrics.current_apps;
      chest.current_dsa = liveMetrics.current_dsa;
      chest.current_study_minutes = liveMetrics.current_study_minutes;
    }

    // 3. Compute completion percentages
    const appsPct = Math.min(100, Math.round((chest.current_apps / (chest.target_apps || 1)) * 100));
    const dsaPct = Math.min(100, Math.round((chest.current_dsa / (chest.target_dsa || 1)) * 100));
    const studyPct = Math.min(100, Math.round((chest.current_study_minutes / (chest.target_study_minutes || 1)) * 100));
    const overallPct = Math.min(100, Math.round((appsPct + dsaPct + studyPct) / 3));

    const isUnlocked = chest.current_apps >= chest.target_apps &&
                       chest.current_dsa >= chest.target_dsa &&
                       chest.current_study_minutes >= chest.target_study_minutes;

    res.json({
      weekId: chest.week_id,
      mondayDate: mondayStr,
      sundayDate: sundayStr,
      targets: {
        apps: chest.target_apps,
        dsa: chest.target_dsa,
        studyMinutes: chest.target_study_minutes,
      },
      progress: {
        apps: chest.current_apps,
        dsa: chest.current_dsa,
        studyMinutes: chest.current_study_minutes,
      },
      percentages: {
        apps: appsPct,
        dsa: dsaPct,
        study: studyPct,
        overall: overallPct,
      },
      isUnlocked,
      isClaimed: Boolean(chest.is_claimed),
      claimedAt: chest.claimed_at,
      bonusXpAwarded: chest.bonus_xp_awarded || 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/weekly-chest/claim
 * Verifies 100% completion, awards +100 Bonus XP, marks chest claimed
 */
exports.claimChest = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to claim weekly rewards' });
    }

    const tz = req.user?.timezone || req.body?.tz || 'Asia/Kolkata';
    const { weekId, mondayStr, sundayStr } = getIsoWeekWindow(new Date(), tz);

    const chest = db.prepare(`
      SELECT * FROM weekly_chests 
      WHERE user_id = ? AND week_id = ?
    `).get(userId, weekId);

    if (!chest) {
      return res.status(404).json({ error: 'No weekly quest record found for this week.' });
    }

    if (chest.is_claimed) {
      return res.status(400).json({ error: 'Weekly chest has already been claimed for this week.' });
    }

    // Re-verify live metrics
    const liveMetrics = calculateLiveWeeklyMetrics(userId, mondayStr, sundayStr);
    const meetsRequirements =
      liveMetrics.current_apps >= chest.target_apps &&
      liveMetrics.current_dsa >= chest.target_dsa &&
      liveMetrics.current_study_minutes >= chest.target_study_minutes;

    if (!meetsRequirements) {
      return res.status(400).json({
        error: 'Weekly quests have not yet reached 100% completion.',
        current: liveMetrics,
        targets: {
          apps: chest.target_apps,
          dsa: chest.target_dsa,
          studyMinutes: chest.target_study_minutes,
        },
      });
    }

    const BONUS_XP = 100;
    const nowIso = new Date().toISOString();

    runInTransaction(() => {
      db.prepare(`
        UPDATE weekly_chests 
        SET is_claimed = 1,
            claimed_at = ?,
            bonus_xp_awarded = ?,
            current_apps = ?,
            current_dsa = ?,
            current_study_minutes = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        nowIso,
        BONUS_XP,
        liveMetrics.current_apps,
        liveMetrics.current_dsa,
        liveMetrics.current_study_minutes,
        chest.id
      );
    });

    // Calculate updated gamification with the new +100 XP
    let gamification = null;
    try {
      gamification = calculateGamification(userId, tz);
    } catch (_) {}

    res.json({
      ok: 1,
      message: '🎉 Weekly Gold Chest unlocked! +100 Bonus XP awarded to your trophy rank.',
      bonusXp: BONUS_XP,
      claimedAt: nowIso,
      weekId,
      gamification,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/weekly-chest/vault
 * Fetches historical badges and past completed weekly chests
 */
exports.getVault = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) {
      return res.json({
        badges: [],
        totalClaimed: 0,
        totalBonusXp: 0,
      });
    }

    const rows = db.prepare(`
      SELECT 
        id, week_id, target_apps, target_dsa, target_study_minutes,
        current_apps, current_dsa, current_study_minutes,
        is_claimed, claimed_at, bonus_xp_awarded, created_at
      FROM weekly_chests 
      WHERE user_id = ? AND is_claimed = 1 
      ORDER BY week_id DESC
    `).all(userId);

    const totalClaimed = rows.length;
    const totalBonusXp = rows.reduce((sum, r) => sum + (r.bonus_xp_awarded || 0), 0);

    const badges = rows.map(r => ({
      id: r.id,
      weekId: r.week_id,
      claimedAt: r.claimed_at,
      bonusXp: r.bonus_xp_awarded,
      targets: {
        apps: r.target_apps,
        dsa: r.target_dsa,
        studyMinutes: r.target_study_minutes,
      },
      achieved: {
        apps: r.current_apps,
        dsa: r.current_dsa,
        studyMinutes: r.current_study_minutes,
      },
    }));

    res.json({
      badges,
      totalClaimed,
      totalBonusXp,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/weekly-chest/targets
 * Customizes weekly quest targets (default: 10 apps, 5 DSA, 180 min study)
 */
exports.updateTargets = (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Please log in to customize quest targets' });
    }

    const { target_apps, target_dsa, target_study_minutes, tz } = req.body;

    const apps = Math.max(1, Math.min(100, Number(target_apps) || 10));
    const dsa = Math.max(1, Math.min(100, Number(target_dsa) || 5));
    const study = Math.max(15, Math.min(3000, Number(target_study_minutes) || 180));

    const userTz = req.user?.timezone || tz || 'Asia/Kolkata';
    const { weekId } = getIsoWeekWindow(new Date(), userTz);

    runInTransaction(() => {
      // 1. Update current week chest
      db.prepare(`
        UPDATE weekly_chests 
        SET target_apps = ?, target_dsa = ?, target_study_minutes = ?, updated_at = datetime('now')
        WHERE user_id = ? AND week_id = ?
      `).run(apps, dsa, study, userId, weekId);

      // 2. Persist default targets in user settings for future weeks
      const upsertSetting = (key, val) => {
        db.prepare(`
          INSERT INTO settings (user_id, key, value) 
          VALUES (?, ?, ?) 
          ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value
        `).run(userId, key, String(val));
      };

      upsertSetting('weekly_chest_target_apps', apps);
      upsertSetting('weekly_chest_target_dsa', dsa);
      upsertSetting('weekly_chest_target_study_minutes', study);
    });

    res.json({
      ok: 1,
      message: 'Weekly quest targets updated successfully',
      targets: {
        apps,
        dsa,
        studyMinutes: study,
      },
    });
  } catch (err) {
    next(err);
  }
};
