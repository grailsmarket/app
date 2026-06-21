const CACHE_VERSION = 'grails-pwa-v1'
const PRECACHE = `${CACHE_VERSION}-precache`
const STATIC_CACHE = `${CACHE_VERSION}-static`
const IMAGE_CACHE = `${CACHE_VERSION}-images`
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/logo.svg',
  '/logo-w-text.svg',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable-512.png',
]

const SAME_ORIGIN_STATIC_PREFIXES = ['/_next/static/', '/fonts/', '/icons/', '/logos/', '/tokens/', '/chains/']
const SAME_ORIGIN_IMAGE_PREFIXES = ['/art/', '/clubs/', '/previews/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', (event) => {
  event.waitUntil(showPushNotification(event.data))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(openNotificationTarget(event.notification.data?.url))
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (!shouldHandle(request)) return

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (isImageAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
  }
})

function shouldHandle(request) {
  if (request.method !== 'GET') return false
  if (request.headers.has('range')) return false

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname.startsWith('/_next/webpack-hmr')) return false
  if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') return false

  return true
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request)
  } catch {
    const cached = await caches.match(OFFLINE_URL)
    return cached || Response.error()
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const responsePromise = fetch(request)
    .then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached || responsePromise
}

function isStaticAsset(url) {
  return SAME_ORIGIN_STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function isImageAsset(request, url) {
  if (request.destination === 'image') return true
  return SAME_ORIGIN_IMAGE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function isCacheable(response) {
  return response && response.ok && response.type === 'basic'
}

async function showPushNotification(pushData) {
  const payload = parsePushPayload(pushData)
  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Grails Market'
  const body = typeof payload.body === 'string' && payload.body ? payload.body : 'You have a new notification'
  const url = normalizeNotificationUrl(payload.url)

  await self.registration.showNotification(title, {
    body,
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    data: {
      ...payload,
      url,
    },
  })
}

function parsePushPayload(pushData) {
  if (!pushData) return {}

  const text = pushData.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return {
      body: text,
    }
  }
}

async function openNotificationTarget(rawUrl) {
  const targetUrl = normalizeNotificationUrl(rawUrl)
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const exactClient = windowClients.find((client) => client.url === targetUrl)

  if (exactClient) {
    await exactClient.focus()
    return
  }

  const rootClient = windowClients.find((client) => new URL(client.url).origin === self.location.origin)
  if (rootClient) {
    await rootClient.focus()
    rootClient.navigate(targetUrl)
    return
  }

  await self.clients.openWindow(targetUrl)
}

function normalizeNotificationUrl(rawUrl) {
  try {
    const url = new URL(typeof rawUrl === 'string' ? rawUrl : '/', self.location.origin)
    if (url.origin !== self.location.origin) return self.location.origin
    return url.href
  } catch {
    return self.location.origin
  }
}
