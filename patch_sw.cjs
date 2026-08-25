const fs = require('fs');
let code = fs.readFileSync('public/sw.js', 'utf8');

const fcmCode = `
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA4EPaIQQPtq84sLGRVCdvrGQp_KJY_xcU",
  authDomain: "ai-studio-applet-webapp-1f194.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-1f194",
  storageBucket: "ai-studio-applet-webapp-1f194.firebasestorage.app",
  messagingSenderId: "507598207607",
  appId: "1:507598207607:web:983690abb93e07db7c6472"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'FlowState';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body,
    icon: '/icons/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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

code = fcmCode + '\n\n' + code;

// Remove the manual push event we added earlier
code = code.replace(/self\.addEventListener\('push', function\(event\) \{[\s\S]*?\}\);\n\nself\.addEventListener\('notificationclick', function\(event\) \{[\s\S]*?\}\);/g, '');

fs.writeFileSync('public/sw.js', code);
