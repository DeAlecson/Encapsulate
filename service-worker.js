/* =========================================================
   service-worker.js — Offline cache for Encapsulate
   ========================================================= */

const CACHE_NAME = 'encapsulate-v7';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/themes.css',
  './css/styles.css',
  './css/editor.css',
  './js/storage.js',
  './js/state.js',
  './js/utils.js',
  './js/router.js',
  './js/gamification.js',
  './js/ai-prompts.js',
  './js/ai.js',
  './js/fallback-marker.js',
  './js/marking-service.js',
  './js/settings.js',
  './js/lesson-engine.js',
  './js/quiz-engine.js',
  './js/practice-engine.js',
  './js/mock-engine.js',
  './js/renderer.js',
  './js/app.js',
  './data/app-config.json',
  './data/units.json',
  './data/lessons/welcome.json',
  './data/lessons/su1.json',
  './data/lessons/su2.json',
  './data/lessons/su3.json',
  './data/lessons/su4.json',
  './data/lessons/su5.json',
  './data/lessons/su6.json',
  './data/quizzes/su1_quiz.json',
  './data/quizzes/su2_quiz.json',
  './data/quizzes/su3_quiz.json',
  './data/quizzes/su4_quiz.json',
  './data/quizzes/su5_quiz.json',
  './data/quizzes/su6_quiz.json',
  './data/coding/su1_coding.json',
  './data/coding/su2_coding.json',
  './data/coding/su3_coding.json',
  './data/coding/su4_coding.json'
];

/* App-shell file extensions that should always be fresh */
const isAppShell = (url) => /\.(html|js|css)(\?.*)?$/.test(url.pathname) || url.pathname.endsWith('/');

/* Install — cache static assets */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate — clean old caches */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch — network-first for app shell, cache-first for data */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for Anthropic API calls
  if (url.hostname === 'api.anthropic.com') {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Network-first for HTML/JS/CSS — ensures fresh code after each deploy
  if (isAppShell(url)) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for data files (JSON assets)
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => {
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
