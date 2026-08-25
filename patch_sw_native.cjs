const fs = require('fs');
let code = fs.readFileSync('public/sw.js', 'utf8');

// Remove Firebase FCM imports and init
code = code.replace(/importScripts\('https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.2\/firebase-app-compat\.js'\);\nimportScripts\('https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.2\/firebase-messaging-compat\.js'\);\n\nfirebase\.initializeApp\(\{[\s\S]*?\}\);\n\nconst messaging = firebase\.messaging\(\);\n\nmessaging\.onBackgroundMessage\(function\(payload\) \{[\s\S]*?\}\);\n\nself\.addEventListener\('notificationclick', function\(event\) \{[\s\S]*?\}\);\n\n/g, '');

// Append native push and notificationclick
const nativeCode = `
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
  
  const title = data.notification?.title || data.data?.title || data.title || 'FlowState';
  const body = data.notification?.body || data.data?.body || data.body || 'You have a new notification';
  const url = data.notification?.click_action || data.data?.url || data.url || '/';

  const options = {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
`;

code = code + '\n' + nativeCode;

fs.writeFileSync('public/sw.js', code);
