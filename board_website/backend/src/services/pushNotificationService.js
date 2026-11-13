let webpush = null;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('[Push Notification Service] web-push package note:', e.message);
}
const config = require('../config');
const { db } = require('../database/db');

let vapidConfigured = false;
try {
  if (webpush && config.vapid?.publicKey && config.vapid?.privateKey) {
    webpush.setVapidDetails(
      config.vapid.email || 'mailto:support@jobtracker.app',
      config.vapid.publicKey,
      config.vapid.privateKey
    );
    vapidConfigured = true;
  }
} catch (err) {
  console.warn('[Push Notification] VAPID initialization warning:', err.message);
}

/**
 * Get active VAPID public key for frontend subscription handshake
 */
function getPublicKey() {
  return config.vapid?.publicKey || '';
}

/**
 * Check if user has active mobile push subscription(s) registered
 */
function hasActivePushSubscription(userId) {
  if (!userId) return false;
  try {
    const row = db.prepare("SELECT id FROM push_subscriptions WHERE user_id = ? LIMIT 1").get(userId);
    return Boolean(row);
  } catch (_) {
    return false;
  }
}

/**
 * Get all active subscriptions for user
 */
function getUserSubscriptions(userId) {
  if (!userId) return [];
  try {
    return db.prepare("SELECT * FROM push_subscriptions WHERE user_id = ?").all(userId);
  } catch (_) {
    return [];
  }
}

/**
 * Save new or updated push subscription
 */
function saveSubscription(userId, subscription, userAgent = '') {
  if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid subscription object');
  }

  const { endpoint, keys } = subscription;
  const p256dh = keys.p256dh;
  const auth = keys.auth;

  try {
    const existing = db.prepare("SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").get(userId, endpoint);
    if (existing) {
      db.prepare("UPDATE push_subscriptions SET p256dh = ?, auth = ?, user_agent = ?, updated_at = datetime('now') WHERE id = ?").run(p256dh, auth, userAgent, existing.id);
      return { id: existing.id, status: 'updated' };
    } else {
      const res = db.prepare("INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent) VALUES (?, ?, ?, ?, ?)").run(userId, endpoint, p256dh, auth, userAgent);
      return { id: res.lastInsertRowid, status: 'created' };
    }
  } catch (err) {
    console.error('[Push Subscription Save Error]:', err.message);
    throw err;
  }
}

/**
 * Unsubscribe / delete endpoint
 */
function deleteSubscription(userId, endpoint) {
  try {
    if (endpoint) {
      db.prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").run(userId, endpoint);
    } else {
      db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?").run(userId);
    }
    return { ok: true };
  } catch (err) {
    console.error('[Push Subscription Delete Error]:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Dispatch Push Notification for streak reminder
 */
async function sendStreakPushNotification(user, reminderType, streak, stats = {}, slot = 'dinner') {
  if (!vapidConfigured) {
    throw new Error('Web Push VAPID is not configured');
  }

  const subscriptions = getUserSubscriptions(user.id);
  if (!subscriptions || subscriptions.length === 0) {
    return { sentCount: 0, total: 0 };
  }

  const isLunch = slot === 'lunch';
  const isNeedsApp = reminderType === 'needs_app';
  const isNeedsStudy = reminderType === 'needs_study';

  let title = '';
  let body = '';

  if (isLunch) {
    title = `🍱 Midday Streak Check • ${streak}d Streak`;
    if (isNeedsApp) {
      body = 'You studied today! Submit 1 job application before lunch to keep your streak safe.';
    } else if (isNeedsStudy) {
      body = 'You applied today! Squeeze in 1 study topic or DSA problem before lunch.';
    } else {
      body = `Protect your ${streak}-day streak! 1 job app & 1 study topic needed today.`;
    }
  } else {
    title = `🔥 Evening Streak Safeguard • ${streak}d Streak`;
    if (isNeedsApp) {
      body = 'Almost there! Submit 1 job application before midnight to protect your streak.';
    } else if (isNeedsStudy) {
      body = 'Finish strong! Log 1 study topic or solve 1 DSA before midnight to save your streak.';
    } else {
      body = `Your ${streak}-day streak is on the line! 1 job app & 1 study topic needed before midnight.`;
    }
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `streak-${slot}-${user.id}`,
    renotify: true,
    data: {
      url: 'https://kanban-board-job.vercel.app/',
      slot,
      reminderType,
      streak
    }
  });

  let sentCount = 0;
  for (const sub of subscriptions) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };

    try {
      await webpush.sendNotification(pushSub, payload);
      sentCount++;
    } catch (err) {
      // 404 or 410 Gone means the browser revoked or expired the subscription
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`[Push Notification] Pruning expired subscription for user ${user.id}`);
        try {
          db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
        } catch (_) {}
      } else {
        console.warn(`[Push Notification Send Warning for user ${user.id}]:`, err.message);
      }
    }
  }

  return { sentCount, total: subscriptions.length };
}

module.exports = {
  getPublicKey,
  hasActivePushSubscription,
  getUserSubscriptions,
  saveSubscription,
  deleteSubscription,
  sendStreakPushNotification
};

