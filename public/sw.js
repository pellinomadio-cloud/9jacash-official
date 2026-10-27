// 9jacash Android & Web Device Notification Service Worker
// Enables native OS status bar & lock screen notifications

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle user clicking on the notification on their Android status bar or lock screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && client.url.indexOf(self.location.origin) !== -1) {
            client.focus();
            return client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, launch a new window directly into the app
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Direct message triggers from web app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_DEVICE_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-badge.png',
        vibrate: [200, 100, 200, 100, 300],
        renotify: true,
        ...options,
      });
    }
  }
});

// Background Push Notification handler (for push messages)
self.addEventListener('push', (event) => {
  let payload = {
    title: '9jacash • Account Alert',
    body: 'Your 9jacash account is active. Tap to view balance and transactions.',
    icon: '/icon-192.png',
    badge: '/icon-badge.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: '9jacash-push-' + Date.now(),
    renotify: true,
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-badge.png',
      vibrate: payload.vibrate || [200, 100, 200, 100, 300],
      tag: payload.tag || '9jacash-alert',
      renotify: true,
      data: payload.data || { url: '/' },
    })
  );
});

// Periodic background sync (runs in OS background when installed on Android / Chromium)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === '9jacash-check-broadcasts') {
    event.waitUntil(
      fetch('https://firestore.googleapis.com/v1/projects/jacash-56866/databases/(default)/documents/device_broadcasts?pageSize=1')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.documents && data.documents.length > 0) {
            const doc = data.documents[0];
            const fields = doc.fields || {};
            const title = (fields.title && fields.title.stringValue) || 'Message from 9jacash company';
            const body = (fields.body && fields.body.stringValue) || 'New update available from 9jacash company.';
            const actionUrl = (fields.actionUrl && fields.actionUrl.stringValue) || '/';
            return self.registration.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-badge.png',
              vibrate: [200, 100, 200, 100, 300],
              tag: '9jacash-periodic-' + Date.now(),
              renotify: true,
              data: { url: actionUrl },
            });
          }
        })
        .catch(() => {})
    );
  }
});

