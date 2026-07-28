/**
 * Service Worker des Abendstrategen.
 *
 * Zwei Aufgaben:
 *   1. Push-Benachrichtigungen empfangen und anzeigen – auch wenn die App
 *      geschlossen ist. Nur deshalb kann der Versand serverseitig laufen.
 *   2. Ein bescheidenes Offline-Verhalten: Die zuletzt geladene Oberfläche
 *      bleibt erreichbar, wenn das Netz fehlt.
 *
 * Bewusst ohne Build-Schritt: Die Datei wird unverändert ausgeliefert, damit
 * sie unter der Wurzel liegt und für die ganze App zuständig ist.
 */

const CACHE = 'abendstratege-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Der Anmeldedienst von Firebase liegt unter /__/ und darf nie aus dem Cache kommen.
  if (url.pathname.startsWith('/__/')) return

  // Seitenaufrufe: erst das Netz, damit neue Versionen sofort ankommen.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          const cache = await caches.open(CACHE)
          cache.put('/index.html', response.clone())
          return response
        } catch {
          const cached = await caches.match('/index.html')
          return cached ?? Response.error()
        }
      })(),
    )
    return
  }

  // Gebaute Dateien tragen einen Hash im Namen – die dürfen dauerhaft liegen bleiben.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE)
          cache.put(request, response.clone())
        }
        return response
      })(),
    )
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Der Abendstratege'
  const options = {
    body: payload.body || 'Nimm dir jetzt kurz Zeit für deine Reflexion.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/badge-72.png',
    tag: payload.tag || 'abend-erinnerung',
    renotify: false,
    data: { url: payload.url || '/?view=reflect' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/?view=reflect'

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      // Ein bereits offenes Fenster wird nach vorn geholt, statt ein zweites zu öffnen.
      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) continue
        await client.focus()
        if ('navigate' in client) await client.navigate(target)
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
