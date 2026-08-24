self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Minimal fetch listener to pass PWA installability requirements.
  // We do not aggressively cache private data here.
  // Rely on browser caching and standard network requests for a safe baseline.
});
