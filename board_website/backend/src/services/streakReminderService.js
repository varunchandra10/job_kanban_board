const { db } = require('../database/db');
const { calculateGamification } = require('../controllers/learningsController');
const { sendStreakReminderEmail } = require('./emailService');

let schedulerInterval = null;

/**
 * Format today's date in specific timezone
 */
function getLocalDateParts(tz = 'Asia/Kolkata') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

    return {
      dateStr: `${year}-${month}-${day}`,
      hour,
      minute
    };
  } catch (_) {
    const d = new Date();
    return {
      dateStr: d.toISOString().slice(0, 10),
      hour: d.getHours(),
      minute: d.getMinutes()
    };
  }
}

/**
 * Scan all registered users, assess their daily streak quest, and dispatch evening emails if incomplete.
 * @param {object} options - { forceAll: boolean, targetUserId: string }
 */
async function checkAndSendStreakReminders(options = {}) {
  const { forceAll = false, targetUserId = null } = options;

  let query = "SELECT id, email, name, timezone, streak_reminders_enabled FROM users WHERE email IS NOT NULL AND email != '' AND email NOT LIKE '%@jobtracker.app%'";
  const params = [];

  if (targetUserId) {
    query += " AND id = ?";
    params.push(targetUserId);
  }

  const users = db.prepare(query).all(...params);
  const results = {
    totalChecked: users.length,
    sent: 0,
    skippedCompleted: 0,
    skippedAlreadySent: 0,
    skippedTimeWindow: 0,
    skippedOptOut: 0,
    errors: []
  };

  for (const user of users) {
    try {
      // 1. Check opt-out
      if (user.streak_reminders_enabled === 0 && !forceAll) {
        results.skippedOptOut++;
        continue;
      }

      const tz = user.timezone || 'Asia/Kolkata';
      const { dateStr, hour } = getLocalDateParts(tz);

      // 2. Evening time window check (between 19:00 and 23:59 local time)
      // Gives user 4.5+ hours of ample time before midnight
      if (!forceAll && (hour < 19 || hour > 23)) {
        results.skippedTimeWindow++;
        continue;
      }

      // 3. Anti-spam check: has user already received a streak reminder today?
      const existingReminder = db.prepare(
        "SELECT id, type FROM streak_reminders WHERE user_id = ? AND date = ?"
      ).get(user.id, dateStr);

      if (existingReminder && !forceAll) {
        results.skippedAlreadySent++;
        continue;
      }

      // 4. Calculate user's gamification & today's streak status
      const stats = calculateGamification(user.id, tz);

      // If user already satisfied both goals today, streak is safe!
      if (stats.todayCompleted) {
        results.skippedCompleted++;
        continue;
      }

      let reminderType = null;
      if (stats.todayNeedsStudy) {
        // User applied to at least 1 job, but has not completed 45m study or 1 DSA
        reminderType = 'needs_study';
      } else if (stats.todayNeedsApp) {
        // User studied/DSA, but has not submitted a job application
        reminderType = 'needs_app';
      } else {
        // Neither done today. If user has an active streak, remind them to act
        if (stats.streak > 0 || forceAll) {
          reminderType = 'needs_study';
        }
      }

      if (!reminderType) {
        continue;
      }

      // 5. Send Email
      await sendStreakReminderEmail(user, reminderType, stats.streak, stats);

      // 6. Record in DB to guarantee at most 1 reminder per day
      try {
        db.prepare(
          "INSERT INTO streak_reminders (user_id, date, type, sent_at) VALUES (?, ?, ?, datetime('now'))"
        ).run(user.id, dateStr, reminderType);
      } catch (err) {
        // Unique constraint ignore
      }

      results.sent++;
      console.log(`[Streak Reminder] Dispatched ${reminderType} reminder to ${user.email} (${dateStr}, streak: ${stats.streak})`);
    } catch (err) {
      console.error(`[Streak Reminder Error for user ${user.id}]:`, err.message);
      results.errors.push({ userId: user.id, error: err.message });
    }
  }

  return results;
}

/**
 * Start background scheduler that checks for evening reminders every 30 minutes
 */
function startStreakScheduler() {
  if (schedulerInterval) return;

  console.log('[Streak Scheduler] Initialized. Scanning for local evening windows every 30 minutes.');

  // Run initial check after 10 seconds of startup
  setTimeout(() => {
    checkAndSendStreakReminders().catch(err => {
      console.warn('[Streak Scheduler Startup Check]:', err.message);
    });
  }, 10000);

  // Then check every 30 minutes
  schedulerInterval = setInterval(() => {
    checkAndSendStreakReminders().catch(err => {
      console.warn('[Streak Scheduler Periodic Check]:', err.message);
    });
  }, 30 * 60 * 1000);
}

module.exports = {
  checkAndSendStreakReminders,
  startStreakScheduler
};

