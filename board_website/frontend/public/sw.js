// Job Tracker Web Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push events from Vercel / server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (_) {
      data = { title: 'Job Tracker', body: event.data.text() };
    }
  }

  const title = data.title || '⚡ Job Tracker Streak Reminder';
  const options = {
    body: data.body || 'Open Job Tracker to keep your daily streak alive!',
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    data: data.data || { url: '/' },
    vibrate: [200, 100, 200],
    renotify: true,
    tag: data.tag || 'job-tracker-streak',
    actions: [
      { action: 'open', title: 'Open Tracker' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle tap on the notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

