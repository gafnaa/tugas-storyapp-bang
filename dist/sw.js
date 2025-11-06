
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


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        
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


self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  
  if (request.method !== 'GET') {
    return;
  }

  
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => {
        
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      })
    );
    return;
  }

  
  if (url.pathname.startsWith('/v1/') || url.hostname === 'story-api.dicoding.dev') {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  
  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheFirstStrategy(request)
    );
    return;
  }

  
  event.respondWith(
    networkFirstStrategy(request, CACHE_NAME)
  );
});


async function networkFirstStrategy(request, cacheName = API_CACHE_NAME) {
  const cache = await caches.open(cacheName);
  
  
  
  const cacheKey = request.url.includes('story-api.dicoding.dev') 
    ? new Request(request.url, { method: 'GET' })
    : request;
  
  try {
    
    const networkResponse = await fetch(request);
    
    
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(cacheKey, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    
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
    
    
    throw error;
  }
}


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
    
    if (request.headers.get('accept')?.includes('text/html')) {
      return cache.match('/');
    }
    throw error;
  }
}


self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Story Notification',
    body: 'Anda memiliki notifikasi baru',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {}
  };

  
  if (event.data) {
    try {
      const data = event.data.json();
      
      
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
      
      const textData = event.data.text();
      notificationData.body = textData || notificationData.body;
      
      
      
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


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  
  if (action === 'close') {
    return;
  }

  
  const storyId = notificationData.storyId;
  const urlToOpen = '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/') && 'focus' in client) {
            
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
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen).then((client) => {
            if (client && storyId) {
              
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


self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

