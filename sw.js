// Classic service worker: offline app shell for Last-Mile Tutor.
// No modules, no external URLs, no localStorage access.

const CACHE_NAME = 'lmt-shell-v3';
const SHELL = ['./', './index.html', './style.css', './content.js', './app.js', './manifest.json'];

// Pre-cache the app shell, then activate this worker right away.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

// Remove old shell caches from previous versions, then take control of open pages.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('lmt-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only cache GET requests for our own origin; let everything else pass through.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

// Page loads: prefer the network and refresh the cache; fall back to the cached shell offline.
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match('./index.html');
    return cached || offlineResponse();
  }
}

// Other same-origin GETs: answer from cache immediately, update cache in the background.
async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });

  if (cached) {
    // Keep the worker alive until the background update finishes; ignore its failures.
    event.waitUntil(networkFetch.catch(() => {}));
    return cached;
  }

  try {
    return await networkFetch;
  } catch (error) {
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response('Offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
