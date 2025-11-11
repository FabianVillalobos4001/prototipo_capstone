self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data ? safeJson(event.data.text()) : {}
  const title = data.title || 'Nueva notificacion'
  const options = {
    body: data.body || '',
    data: data.data || {},
    icon: '/vite.svg',
    badge: '/vite.svg',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl)) {
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

