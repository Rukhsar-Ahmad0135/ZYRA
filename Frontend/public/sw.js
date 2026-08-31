// Service Worker for ZYRA - Offline Support & Performance
const CACHE_NAME = 'zyra-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: 'cache-first',
  // Network first for API calls
  api: 'network-first',
  // Stale while revalidate for pages
  pages: 'stale-while-revalidate',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  // Determine cache strategy based on request type
  const isStaticAsset = request.destination === 'script' || 
                        request.destination === 'style' ||
                        request.destination === 'font' ||
                        request.destination === 'image' ||
                        url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|webp|svg|ico)$/);
  
  const isApiCall = url.pathname.startsWith('/api/');
  const isPageNavigation = request.mode === 'navigate' || 
                           request.destination === 'document';

  if (isStaticAsset) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isApiCall) {
    // Network first for API calls
    event.respondWith(networkFirst(request));
  } else if (isPageNavigation) {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: network first
    event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy - for static assets
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy - for API calls
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Stale While Revalidate - for pages
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // Sync offline cart actions when online
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_CART' });
  });
}

// Push notifications (if needed)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});