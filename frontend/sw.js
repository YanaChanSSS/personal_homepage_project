// Service Worker for caching and offline functionality
const CACHE_NAME = 'yanchan-v1.0.1';
const urlsToCache = [
  '/',
  '/home.html',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/css/shared.css',
  '/css/home.css',
  '/css/register.css',
  '/css/optimized.css',
  '/js/utils.js',
  '/js/home.js'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// 获取事件 - 实现缓存策略
self.addEventListener('fetch', event => {
  // 只处理同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const isApiRequest = event.request.url.includes('/api/');
  const isGetMethod = event.request.method === 'GET';

  if (isApiRequest || !isGetMethod) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.error('Network request failed:', error);
        throw error;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/home.html');
          }
          
          console.error('Fetch failed:', error);
          throw error;
        });
      })
  );
});

// 推送通知事件处理
self.addEventListener('push', event => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? event.data.json() : { title: 'YanaChan', body: '您有新的通知' };
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/images/logo.png',
    badge: '/images/logo.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知点击事件处理
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});