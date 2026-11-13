const { db } = require('../database/db');
const { calculateGamification } = require('../controllers/learningsController');
const { sendStreakReminderEmail } = require('./emailService');
const pushNotificationService = require('./pushNotificationService');

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
 * Scan all registered users, assess their daily streak quest, and dispatch lunch/dinner emails if incomplete.
 * @param {object} options - { forceAll: boolean, targetUserId: string, slot: 'lunch' | 'dinner' }
 */
async function checkAndSendStreakReminders(options = {}) {
  const { forceAll = false, targetUserId = null, slot = null } = options;

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

      // 2. Determine slot: 'lunch' (before lunch: 11:00 to 15:59) or 'dinner' (before dinner: 18:00 to 23:59)
      let currentSlot = slot;
      if (!currentSlot) {
        if (hour >= 11 && hour < 16) {
          currentSlot = 'lunch';
        } else if (hour >= 18 && hour <= 23) {
          currentSlot = 'dinner';
        }
      }

      // If outside both reminder windows and not forcing, skip
      if (!forceAll && !currentSlot) {
        results.skippedTimeWindow++;
        continue;
      }

      // 3. Anti-spam check: has user already received a reminder for this slot today?
      const existingReminder = db.prepare(
        "SELECT id, type FROM streak_reminders WHERE user_id = ? AND date = ? AND (type LIKE ? OR type = ?)"
      ).get(user.id, dateStr, `%_${currentSlot}`, currentSlot);

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

      // Determine exact reminder required by streak rules:
      // - if user didn't apply any job today and studied something -> reminder for job apply
      // - if user applied something and didn't study -> reminder for study
      // - if user did not do both -> reminder for both
      let reminderType = null;
      if (!stats.todayHasApp && stats.todayHasStudy) {
        reminderType = 'needs_app';
      } else if (stats.todayHasApp && !stats.todayHasStudy) {
        reminderType = 'needs_study';
      } else if (!stats.todayHasApp && !stats.todayHasStudy) {
        reminderType = 'needs_both';
      }

      if (!reminderType) {
        continue;
      }

      // 5. Mutually exclusive notification delivery:
      // If user has active mobile web push subscription -> send mobile push ONLY (close mail notification).
      // If user has not enabled web push -> send mail notification ONLY. Not both!
      const hasPush = pushNotificationService.hasActivePushSubscription(user.id);
      let deliveryChannel = 'email';

      if (hasPush) {
        try {
          const pushResult = await pushNotificationService.sendStreakPushNotification(
            user,
            reminderType,
            stats.streak,
            stats,
            currentSlot
          );
          if (pushResult.sentCount > 0) {
            deliveryChannel = 'push';
            console.log(`[Streak Reminder] Dispatched MOBILE PUSH (${currentSlot}) to user ${user.id} (${pushResult.sentCount} devices)`);
          } else {
            // If all push endpoints failed or expired, gracefully fall back to email
            await sendStreakReminderEmail(user, reminderType, stats.streak, stats, currentSlot);
            deliveryChannel = 'email_fallback';
            console.log(`[Streak Reminder] Fallback to EMAIL (${currentSlot}) for ${user.email} (streak: ${stats.streak})`);
          }
        } catch (pushErr) {
          console.warn(`[Streak Reminder] Push delivery error for user ${user.id}, falling back to email:`, pushErr.message);
          await sendStreakReminderEmail(user, reminderType, stats.streak, stats, currentSlot);
          deliveryChannel = 'email_fallback';
        }
      } else {
        // No web push active: send email reminder only
        await sendStreakReminderEmail(user, reminderType, stats.streak, stats, currentSlot);
        console.log(`[Streak Reminder] Dispatched EMAIL (${currentSlot}) to ${user.email} (streak: ${stats.streak})`);
      }

      // 6. Record in DB to guarantee at most 1 reminder per slot per day
      const recordType = `${reminderType}_${currentSlot}`;
      try {
        db.prepare(
          "INSERT INTO streak_reminders (user_id, date, type, slot, sent_at) VALUES (?, ?, ?, ?, datetime('now'))"
        ).run(user.id, dateStr, recordType, currentSlot);
      } catch (err) {
        try {
          db.prepare(
            "INSERT INTO streak_reminders (user_id, date, type, sent_at) VALUES (?, ?, ?, datetime('now'))"
          ).run(user.id, dateStr, recordType);
        } catch (_) {}
      }

      results.sent++;
      console.log(`[Streak Reminder] Dispatched ${reminderType} (${currentSlot}) to ${user.email} (${dateStr}, streak: ${stats.streak})`);
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

