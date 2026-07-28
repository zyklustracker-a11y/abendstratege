/**
 * Erkennung der Rahmenbedingungen für Web Push. Auf dem iPhone gilt eine
 * Besonderheit: Benachrichtigungen sind ausschließlich möglich, wenn die Seite
 * über „Zum Home-Bildschirm“ installiert wurde – im normalen Safari-Tab fehlt
 * die Schnittstelle vollständig.
 */

/** Läuft die App als installierte App (Homescreen / installiertes PWA-Fenster)? */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS meldet sich seit Version 13 als Mac – der Touch-Punkt verrät es doch.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** Hauptversion von iOS/iPadOS, soweit ablesbar. Web Push gibt es ab 16.4. */
export function iosVersion(): number | null {
  const match = /OS (\d+)[._](\d+)/.exec(navigator.userAgent)
  if (!match) return null
  return Number(match[1]) + Number(match[2]) / 10
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export type PushBlocker =
  | 'bereit'
  | 'ios-nicht-installiert'
  | 'ios-zu-alt'
  | 'nicht-unterstuetzt'
  | 'blockiert'

/**
 * Was hindert Benachrichtigungen auf diesem Gerät gerade daran zu laufen?
 * Die Reihenfolge ist bewusst: Der iOS-Hinweis muss vor dem allgemeinen
 * „nicht unterstützt“ kommen, weil er den konkreten Ausweg nennt.
 */
export function pushBlocker(): PushBlocker {
  if (isIOS()) {
    const version = iosVersion()
    if (version !== null && version < 16.4) return 'ios-zu-alt'
    if (!isStandalone()) return 'ios-nicht-installiert'
  }
  if (!pushSupported()) return 'nicht-unterstuetzt'
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied')
    return 'blockiert'
  return 'bereit'
}

export function notificationPermission(): NotificationPermission | 'nicht-verfuegbar' {
  if (typeof Notification === 'undefined') return 'nicht-verfuegbar'
  return Notification.permission
}

/** Kurzer, wiedererkennbarer Gerätename für die Geräteliste im Konto. */
export function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad'
  if (/Android/.test(ua)) return 'Android-Gerät'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows-PC'
  return 'Dieses Gerät'
}
