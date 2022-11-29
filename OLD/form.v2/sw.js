const staticCacheName = 'site-static-v2';
const assets = [
  '/form.v2/',
  '/form.v2/index.html',
  '/form.v2/js/script.js',
  '/form.v2/js/GEPT.js',
  '/form.v2/js/Kids.js',
  '/form.v2/css/style.css',
  '/img/logo-72x72.png',
  '/img/logo-96x96.png',
  '/img/logo-128x128.png',
  '/img/logo-144x144.png',
  '/img/logo-152x152.png',
  '/img/logo-192x192.png',
  '/img/logo-384x384.png',
  '/img/logo-512x512.png'
];
// install event
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log('caching shell assets');
      cache.addAll(assets);
    })
  );
});
// activate event
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});
// fetch event
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(cacheRes => {
      return cacheRes || fetch(evt.request);
    })
  );
});
