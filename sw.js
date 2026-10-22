const CACHE_NAME = 'santher-5minutos-v13';
const CACHE_PREFIX = 'santher-5minutos-';
const APP_SHELL = [
  './', './index.html', './manifest.json', './css/style.css', './js/app.js', './js/semanas.js', './js/escala.js', './js/notificacoes.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/images/cipa-logo.png', './assets/images/santher-logo.png', './assets/images/5min-timer.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const offlinePage = await cache.match('./index.html');
        if (offlinePage) return offlinePage;
      }
      throw error;
    }
  })());
});
