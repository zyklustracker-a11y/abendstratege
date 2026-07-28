import { useEffect, useState } from 'react'
import type { SyncStatus } from '../lib/types'

const LABEL: Record<SyncStatus, string> = {
  laden: 'Lädt …',
  bereit: '',
  speichert: 'Speichert …',
  gespeichert: 'Gespeichert',
  offline: 'Offline – lokal gesichert',
  fehler: 'Nicht gespeichert',
}

/**
 * Dezenter Statushinweis. „Gespeichert“ verschwindet nach kurzer Zeit von
 * selbst – dauerhaft sichtbar bleiben nur die Zustände, die eine Reaktion
 * verdienen.
 */
export function SyncBadge({ status }: { status: SyncStatus }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (status !== 'gespeichert') {
      setVisible(true)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(timer)
  }, [status])

  const label = LABEL[status]
  if (!label || !visible) return null

  const tone =
    status === 'fehler' ? 'sync--warn' : status === 'offline' ? 'sync--muted' : 'sync--quiet'

  return (
    <span className={`sync ${tone}`} role="status" aria-live="polite">
      {label}
    </span>
  )
}
