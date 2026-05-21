/**
 * sw.js — Service Worker de Logidma.
 * Estrategia: network-first para HTML (siempre frescos),
 * cache-first para fuentes y módulos JS (más rápido en cargas siguientes),
 * fallback a /404.html cuando estás offline y la página no está en cache.
 *
 * Cambia VERSION para invalidar todo el cache cuando hagas un release grande.
 */

const VERSION = 'logidma-v4-2026-05';
const STATIC_CACHE = `static-${VERSION}`;
const HTML_CACHE = `html-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/servicios.html',
  '/acerca-de.html',
  '/casos.html',
  '/cotizador.html',
  '/recursos.html',
  '/onboarding.html',
  '/gracias.html',
  '/404.html',
  '/manifest.json',
  '/assets/css/site-chrome.css',
  '/assets/js/firebase-init.js',
  '/assets/js/sanitize.js',
  '/assets/js/forms.js',
  '/assets/js/analytics.js',
  '/assets/js/site-nav.js',
  '/assets/js/site-footer.js',
  '/assets/js/loading.js',
  '/assets/js/page-transition.js',
  '/assets/js/reveal.js',
  '/assets/js/sw-register.js',
  '/blog.html',
  '/blog-post.html',
  '/admin.html'
];

const CACHEABLE_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {
        // No bloquear el install si algún recurso falla
        return Promise.all(PRECACHE_URLS.map(u =>
          fetch(u).then(r => r.ok && cache.put(u, r)).catch(() => {})
        ));
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // NO interceptar peticiones a Firebase, Apps Script, analytics, etc.
  // (queremos que esos siempre lleguen al servidor real)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebasestorage.googleapis.com') ||
      url.hostname.includes('script.google.com') ||
      url.hostname.includes('google-analytics.com') ||
      url.hostname.includes('analytics.google.com') ||
      url.hostname.includes('gstatic.com') &&
        !url.hostname.startsWith('fonts.')) {
    return; // dejar pasar normalmente
  }

  // HTML: network-first con fallback al cache y luego a 404
  if (req.mode === 'navigate' || req.destination === 'document' ||
      (url.origin === self.location.origin && url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(HTML_CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() =>
        caches.match(req).then(r => r || caches.match('/404.html'))
      )
    );
    return;
  }

  // Fuentes y assets propios: cache-first
  if (url.origin === self.location.origin ||
      CACHEABLE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
