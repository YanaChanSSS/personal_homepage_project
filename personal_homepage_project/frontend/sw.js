// Service Worker for caching and offline functionality
const CACHE_NAME = 'yanchan-v1.0.0';
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
  );
});

// 获取事件 - 实现缓存策略
self.addEventListener('fetch', event => {
  // 只缓存同源请求
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到响应，则返回缓存的版本
        if (response) {
          return response;
        }

        // 否则发起网络请求
        return fetch(event.request).then(response => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应，因为响应流只能被消费一次
          const responseToCache = response.clone();

          // 将响应缓存起来
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          // 如果是HTML请求且离线，则返回离线页面
          if (event.request.headers.get('accept').includes('text/html')) {
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