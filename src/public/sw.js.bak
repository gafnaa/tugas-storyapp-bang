// Service Worker untuk PWA dan Push Notification
const CACHE_NAME = 'story-app-v3';
const API_CACHE_NAME = 'story-app-api-v3';
const urlsToCache = [
  '/',
  '/scripts/index.js',
  '/styles/styles.css',
  '/favicon.png',
  '/images/logo.png',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to add all resources, but don't fail if some fail
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Don't cache HTML files - always fetch fresh to get latest version
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => {
        // If network fails, try cache as fallback
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      })
    );
    return;
  }

  // Handle API requests with NetworkFirst strategy
  if (url.pathname.startsWith('/v1/') || url.hostname === 'story-api.dicoding.dev') {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Handle app shell resources with CacheFirst strategy
  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheFirstStrategy(request)
    );
    return;
  }

  // For external resources (CDN, fonts), use NetworkFirst
  event.respondWith(
    networkFirstStrategy(request, CACHE_NAME)
  );
});

// NetworkFirst strategy: Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName = API_CACHE_NAME) {
  const cache = await caches.open(cacheName);
  
  // Create a cache key without Authorization header for API requests
  // This allows cached data to be available even if token changes
  const cacheKey = request.url.includes('story-api.dicoding.dev') 
    ? new Request(request.url, { method: 'GET' })
    : request;
  
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response using cacheKey (without auth headers)
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(cacheKey, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try to get from cache
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and it's an API request, return a meaningful offline response
    if (request.url.includes('story-api.dicoding.dev')) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Tidak dapat terhubung ke server. Mode offline aktif.',
          offline: true
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // For other requests, throw the error
    throw error;
  }
}

// CacheFirst strategy: Try cache first, fallback to network
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails and no cache, return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return cache.match('/');
    }
    throw error;
  }
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Story Notification',
    body: 'Anda memiliki notifikasi baru',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {}
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      
      // Extract story ID from data if available
      let storyId = null;
      if (data.data && data.data.storyId) {
        storyId = data.data.storyId;
      } else if (data.storyId) {
        storyId = data.storyId;
      }
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.options?.body || data.body || notificationData.body,
        icon: data.options?.icon || data.icon || notificationData.icon,
        badge: data.options?.badge || data.badge || notificationData.badge,
        data: {
          ...(data.options?.data || data.data || {}),
          storyId: storyId || (data.options?.data?.storyId) || null
        }
      };
    } catch (e) {
      // If data is not JSON, use as text
      const textData = event.data.text();
      notificationData.body = textData || notificationData.body;
      
      // Try to extract story ID from text if it contains a pattern
      // This is a fallback if the server sends story ID in the body
      const storyIdMatch = textData.match(/story[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
      if (storyIdMatch) {
        notificationData.data.storyId = storyIdMatch[1];
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.data?.storyId || 'story-notification',
      requireInteraction: false,
      actions: notificationData.data?.storyId ? [
        {
          action: 'view',
          title: 'Lihat Detail'
        },
        {
          action: 'close',
          title: 'Tutup'
        }
      ] : [
        {
          action: 'close',
          title: 'Tutup'
        }
      ]
    })
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  // Handle different actions
  if (action === 'close') {
    return;
  }

  // Default action or 'view' action - navigate to story detail
  const storyId = notificationData.storyId;
  const urlToOpen = '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/') && 'focus' in client) {
            // Navigate to home and send message with story ID
            client.focus();
            if (storyId) {
              client.postMessage({
                type: 'SHOW_STORY_DETAIL',
                storyId: storyId
              });
            }
            return;
          }
        }
        // If no window found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen).then((client) => {
            if (client && storyId) {
              // Wait a bit for the page to load, then send message
              setTimeout(() => {
                client.postMessage({
                  type: 'SHOW_STORY_DETAIL',
                  storyId: storyId
                });
              }, 1000);
            }
          });
        }
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

