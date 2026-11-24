// 9jacash Native Installed App Notification Handlers (imported by both dev and production Service Workers)

function showNativeAppNotification(title, options) {
  const safeOptions = options || {};
  const notifOptions = {
    body: safeOptions.body || '',
    icon: safeOptions.icon || '/pwa-192x192.png',
    badge: safeOptions.badge || '/icon-badge.png',
    vibrate: safeOptions.vibrate || [200, 100, 200, 100, 300],
    tag: safeOptions.tag || '9jacash-app-' + Date.now(),
    renotify: safeOptions.renotify !== false,
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    data: Object.assign({ url: '/' }, safeOptions.data || {}),
  };

  try {
    if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
      self.navigator.setAppBadge(1).catch(() => {});
    }
  } catch {
    // Ignore unsupported Badging API
  }

  return self.registration.showNotification(title || '9jacash', notifOptions);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  try {
    if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
      self.navigator.clearAppBadge().catch(() => {});
    }
  } catch {
    // Ignore
  }

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          const targetFullUrl = new URL(targetUrl, self.location.origin).href;
          if (client.url !== targetFullUrl && 'navigate' in client && targetUrl !== '/') {
            return client.focus().then(() => client.navigate(targetFullUrl)).catch(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_DEVICE_NOTIFICATION' || event.data.type === 'SHOW_APP_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && typeof self.registration.showNotification === 'function') {
      event.waitUntil(showNativeAppNotification(title, options));
    }
  } else if (event.data.type === 'CLEAR_APP_BADGE') {
    try {
      if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
        self.navigator.clearAppBadge().catch(() => {});
      }
    } catch {
      // Ignore
    }
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '9jacash • Account Alert',
    body: 'Your 9jacash account is active. Tap to open the app.',
    icon: '/pwa-192x192.png',
    badge: '/icon-badge.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: '9jacash-push-' + Date.now(),
    renotify: true,
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = Object.assign({}, payload, parsed);
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(showNativeAppNotification(payload.title, payload));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === '9jacash-check-broadcasts') {
    event.waitUntil(
      fetch('https://firestore.googleapis.com/v1/projects/jacash-56866/databases/(default)/documents/device_broadcasts?pageSize=1')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.documents && data.documents.length > 0) {
            const doc = data.documents[0];
            const fields = doc.fields || {};
            const title = (fields.title && fields.title.stringValue) || '9jacash';
            const body = (fields.body && fields.body.stringValue) || 'New update available on your 9jacash app.';
            const actionUrl = (fields.actionUrl && fields.actionUrl.stringValue) || '/';
            return showNativeAppNotification(title, {
              body,
              tag: '9jacash-periodic-' + Date.now(),
              data: { url: actionUrl },
            });
          }
        })
        .catch(() => {})
    );
  }
});
