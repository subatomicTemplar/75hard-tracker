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
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
