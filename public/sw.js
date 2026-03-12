const CACHE_NAME = '75hard-v1';
const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|gif|svg|mp4|mp3|ico)$/;

// Install — cache shell assets, skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate — claim clients, clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and supabase API calls
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase')) return;

  if (STATIC_EXTENSIONS.test(url.pathname)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

// Push notification — show notification + set badge + notify clients
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || '75 Hard Reminder';
  const options = {
    body: data.body || "Don't forget to log your progress today!",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-reminder',
    renotify: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.registration.setAppBadge?.(1),
      self.clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
          client.postMessage({ type: 'PUSH_RECEIVED' });
        }
      }),
    ])
  );
});

// Notification click — clear badge + open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    Promise.all([
      self.registration.clearAppBadge?.(),
      self.clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
          client.postMessage({ type: 'BADGE_CLEARED' });
        }
        // Focus existing window or open new one
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        }
        return self.clients.openWindow('/');
      }),
    ])
  );
});
