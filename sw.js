// 离线缓存名称
const CACHE_NAME = 'pwa-app-cache-v1';
// 离线缓存的文件
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/sw.js',
  '/manifest.json',
  '/logo.png'
];

// 配置：决定使用网络优先还是缓存优先策略
const cacheStrategy = 'cache-first' // 或者 'cache-first'

// 安装阶段：缓存必要的资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // 强制激活新版本
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // 立即控制所有页面
});

// 请求拦截：使用缓存策略响应请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    if (cacheStrategy === 'network-first') {
      // 尝试从网络获取最新内容，失败后使用缓存
      try {
        const responseFromNetwork = await fetch(request);
        return responseFromNetwork;
      } catch (error) {
        const responseFromCache = await caches.match(request);
        if (responseFromCache) return responseFromCache;
        if (request.destination === 'document') return caches.match('/');
      }
    } else if (cacheStrategy === 'cache-first') {
      // 先尝试从缓存中获取，如果不存在则从网络获取
      const responseFromCache = await caches.match(request);
      return responseFromCache || fetch(request);
    }
  })());
});