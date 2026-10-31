/* Dear Weather Service Worker：让页面能离线打开，天气本身仍然实时请求。 */

const VERSION = 'dear-weather-v1.0.2'

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .catch(() => {
        /* 单个资源失败不阻塞安装 */
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

function isCacheable(request) {
  try {
    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return false
    if (request.method !== 'GET') return false
    return true
  } catch (e) {
    return false
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!isCacheable(request)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put('./index.html', copy)).catch(() => {})
          return response
        })
        .catch(() =>
          caches
            .match('./index.html')
            .then((cached) => cached || caches.match('./'))
            .then((cached) => cached || Response.error())
        )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {})
          }
          return response
        })
        .catch(() => cached || Response.error())
    })
  )
})
