// 9jacash Installed App & Device Notification Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Network pass-through
});

try {
  importScripts('/sw-notifications.js');
} catch {
  // Handled by VitePWA workbox importScripts in production
}
