import { NOTIFICATION_BODY, NOTIFICATION_TITLE } from './constants'
import { vapidPublicKey, pushConfigured } from './firebase-config'
import { deviceLabel, pushBlocker } from './platform'
import { countDevices, removeDevice, saveDevice } from './remote'
import type { PushDevice } from './types'

const SW_URL = `${import.meta.env.BASE_URL}sw.js`
const DEVICE_KEY = 'abendstratege-device-id'

/** Der VAPID-Schlüssel liegt base64url vor, `subscribe` will rohe Bytes. */
function decodeKey(base64url: string): ArrayBuffer {
  const padded = base64url.padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=')
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function encodeKey(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Die Dokument-Id eines Geräts leitet sich aus dem Endpunkt ab. Damit erzeugt
 * dasselbe Gerät beim erneuten Anmelden keinen zweiten Eintrag, und ein Abo,
 * das der Browser stillschweigend erneuert hat, ersetzt sauber das alte.
 */
async function deviceIdFor(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return Array.from(new Uint8Array(digest).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_URL)
  } catch {
    return null
  }
}

async function readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  await registerServiceWorker()
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

function toDevice(id: string, subscription: PushSubscription): PushDevice {
  return {
    id,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: encodeKey(subscription.getKey('p256dh')),
      auth: encodeKey(subscription.getKey('auth')),
    },
    label: deviceLabel(),
    createdAt: Date.now(),
  }
}

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: 'blockiert' | 'abgelehnt' | 'nicht-unterstuetzt' | 'nicht-konfiguriert' | 'fehler'; detail?: string }

/**
 * Fragt die System-Berechtigung ab, richtet das Push-Abo ein und legt es im
 * Konto ab. Danach kann der Versand serverseitig laufen – die App muss nicht
 * geöffnet sein.
 */
export async function enablePushOnThisDevice(uid: string): Promise<EnableResult> {
  if (!pushConfigured) return { ok: false, reason: 'nicht-konfiguriert' }

  const blocker = pushBlocker()
  if (blocker === 'blockiert') return { ok: false, reason: 'blockiert' }
  if (blocker !== 'bereit') return { ok: false, reason: 'nicht-unterstuetzt' }

  const permission = await Notification.requestPermission()
  if (permission === 'denied') return { ok: false, reason: 'blockiert' }
  if (permission !== 'granted') return { ok: false, reason: 'abgelehnt' }

  const registration = await readyRegistration()
  if (!registration) return { ok: false, reason: 'fehler', detail: 'Service Worker nicht bereit.' }

  try {
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(vapidPublicKey),
      }))

    const id = await deviceIdFor(subscription.endpoint)
    localStorage.setItem(DEVICE_KEY, id)
    await saveDevice(uid, toDevice(id, subscription))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: 'fehler', detail: (error as Error).message }
  }
}

/**
 * Ergänzt beim App-Start stillschweigend das Abo dieses Geräts, wenn die
 * Erinnerung im Konto aktiv ist. So genügt ein neues Handy dem Anmelden –
 * die Einstellung muss dort nicht erneut gesetzt werden.
 */
export async function syncPushDevice(uid: string): Promise<void> {
  if (!pushConfigured) return
  if (pushBlocker() !== 'bereit') return
  if (Notification.permission !== 'granted') return

  const registration = await readyRegistration()
  if (!registration) return

  try {
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(vapidPublicKey),
      }))
    const id = await deviceIdFor(subscription.endpoint)
    localStorage.setItem(DEVICE_KEY, id)
    await saveDevice(uid, toDevice(id, subscription))
  } catch {
    // Kein Grund, den Start zu stören – der Nutzer sieht den Status in den Einstellungen.
  }
}

/**
 * Wie viele Geräte im Verteiler dieses Kontos liegen. Für die Diagnose in den
 * Einstellungen; der Weg über diese Datei hält die Ansicht von Firestore fern.
 */
export async function countPushDevices(uid: string): Promise<number> {
  return countDevices(uid)
}

/** Nimmt dieses Gerät aus dem Verteiler; andere Geräte bleiben unberührt. */
export async function disablePushOnThisDevice(uid: string): Promise<void> {
  const stored = localStorage.getItem(DEVICE_KEY)
  const registration = await readyRegistration()
  const subscription = await registration?.pushManager.getSubscription()

  const id = subscription ? await deviceIdFor(subscription.endpoint) : stored
  if (subscription) await subscription.unsubscribe().catch(() => undefined)
  if (id) await removeDevice(uid, id).catch(() => undefined)
  localStorage.removeItem(DEVICE_KEY)
}

/**
 * Prüft die Anzeige auf diesem Gerät sofort – ohne den Umweg über den Server.
 * Der Weg über den Service Worker ist wichtig: Nur so erscheint sie auf dem
 * iPhone genauso wie eine echte Push-Benachrichtigung.
 */
export async function showTestNotification(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
  }
  const registration = await readyRegistration()
  if (!registration) return false
  await registration.showNotification(NOTIFICATION_TITLE, {
    body: NOTIFICATION_BODY,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}badge-72.png`,
    tag: 'abend-erinnerung',
    data: { url: `${import.meta.env.BASE_URL}?view=reflect` },
  })
  return true
}
