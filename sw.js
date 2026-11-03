const CACHE_NAME = 'softstar-shell-v1';
const APP_FILES = [
  './1103_수정본.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('softstar-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.hostname.includes('googleapis.com') && url.pathname.includes('/google.firestore')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./1103_수정본.html', fresh.clone());
        return fresh;
      } catch (error) {
        return (await caches.match('./1103_수정본.html')) || Response.error();
      }
    })());
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const knownCdn = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'].includes(url.hostname);
  if (sameOrigin || knownCdn) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        fetch(request).then(response => {
          if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
        }).catch(() => {});
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
        return response;
      } catch (error) {
        return Response.error();
      }
    })());
  }
});
