self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // NEVER intercept cross-origin requests (Unsplash, Google Fonts, APIs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  // Same-origin navigation fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Same-origin static assets
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
