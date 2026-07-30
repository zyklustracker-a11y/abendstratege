import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { signOutUser } from '../lib/auth'
import { pushConfigured } from '../lib/firebase-config'
import {
  deviceLabel,
  isIOS,
  isStandalone,
  notificationPermission,
  pushBlocker,
  type PushBlocker,
} from '../lib/platform'
import {
  countPushDevices,
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  showTestNotification,
} from '../lib/push'
import { deviceTimeZone } from '../lib/storage'
import type { Reminder } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'

interface Props {
  user: User
  reminder: Reminder
  onReminder: (patch: Partial<Reminder>) => void
  onConfirm: (request: ConfirmRequest) => void
}

type Notice = { tone: 'ok' | 'warn'; text: string } | null

/** Erklärt in Klartext, was der Benachrichtigung gerade im Weg steht. */
function blockerNotice(): Notice {
  switch (pushBlocker()) {
    case 'ios-nicht-installiert':
      return {
        tone: 'warn',
        text: 'Auf dem iPhone erlaubt Apple Benachrichtigungen nur für installierte Apps. Tippe in Safari unten auf „Teilen“ und dann auf „Zum Home-Bildschirm“ – öffne den Abendstrategen anschließend über das neue Symbol und schalte die Erinnerung dort ein.',
      }
    case 'ios-zu-alt':
      return {
        tone: 'warn',
        text: 'Benachrichtigungen im Web gibt es erst ab iOS 16.4. Aktualisiere dein iPhone unter „Einstellungen → Allgemein → Softwareupdate“.',
      }
    case 'blockiert':
      return {
        tone: 'warn',
        text: 'Benachrichtigungen wurden für diese App im System abgelehnt. Auf dem iPhone: „Einstellungen → Mitteilungen → Abendstratege → Mitteilungen erlauben“. Am Rechner: auf das Symbol links in der Adresszeile tippen und die Berechtigung zurücksetzen.',
      }
    case 'nicht-unterstuetzt':
      return {
        tone: 'warn',
        text: 'Dieser Browser kann keine Benachrichtigungen empfangen. Auf dem iPhone brauchst du Safari und die Installation über „Zum Home-Bildschirm“.',
      }
    default:
      return null
  }
}

/** Klartext für die Diagnose – dieselben Begriffe wie in den Hinweisen oben. */
const BLOCKER_LABELS: Record<PushBlocker, string> = {
  bereit: 'bereit',
  'ios-nicht-installiert': 'iPhone: App nicht über „Zum Home-Bildschirm“ installiert',
  'ios-zu-alt': 'iOS älter als 16.4',
  'nicht-unterstuetzt': 'Browser kann keine Benachrichtigungen empfangen',
  blockiert: 'im System abgelehnt',
}

function permissionLabel(value: NotificationPermission | 'nicht-verfuegbar'): string {
  switch (value) {
    case 'granted':
      return 'erteilt'
    case 'denied':
      return 'abgelehnt'
    case 'default':
      return 'noch nicht gefragt'
    default:
      return 'nicht verfügbar'
  }
}

export function SettingsView({ user, reminder, onReminder, onConfirm }: Props) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [permission, setPermission] = useState(notificationPermission())

  // Nach dem Wechsel in die System-Einstellungen und zurück stimmt der Status sonst nicht mehr.
  useEffect(() => {
    const refresh = () => setPermission(notificationPermission())
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  const blocker = pushBlocker()
  const activeHere = permission === 'granted' && blocker === 'bereit'

  // Die Gerätezahl ist ein Lesevorgang in Firestore – erst beim Aufklappen der
  // Diagnose, und dann nur einmal.
  const [devices, setDevices] = useState<number | 'unbekannt' | null>(null)
  const openDiagnose = (open: boolean) => {
    if (!open || devices !== null) return
    void countPushDevices(user.uid).then(setDevices).catch(() => setDevices('unbekannt'))
  }

  const deviceZone = deviceTimeZone()
  const zoneDiffers = Boolean(reminder.timeZone) && reminder.timeZone !== deviceZone

  const toggle = async (next: boolean) => {
    setNotice(null)
    if (!next) {
      setBusy(true)
      await disablePushOnThisDevice(user.uid)
      onReminder({ enabled: false })
      setPermission(notificationPermission())
      setBusy(false)
      return
    }

    setBusy(true)
    const result = await enablePushOnThisDevice(user.uid)
    setPermission(notificationPermission())
    setBusy(false)

    if (result.ok) {
      onReminder({ enabled: true, timeZone: deviceTimeZone() })
      setNotice({ tone: 'ok', text: 'Erinnerung aktiv. Sie kommt auch, wenn die App geschlossen ist.' })
      return
    }

    if (result.reason === 'nicht-konfiguriert') {
      setNotice({ tone: 'warn', text: 'Der Push-Schlüssel fehlt noch in der Konfiguration.' })
      return
    }
    if (result.reason === 'abgelehnt') {
      setNotice({ tone: 'warn', text: 'Ohne Erlaubnis für Mitteilungen geht es leider nicht.' })
      return
    }
    setNotice(
      blockerNotice() ?? {
        tone: 'warn',
        text: result.detail ?? 'Die Erinnerung konnte nicht eingerichtet werden.',
      },
    )
  }

  const test = async () => {
    setBusy(true)
    const shown = await showTestNotification()
    setBusy(false)
    setPermission(notificationPermission())
    setNotice(
      shown
        ? { tone: 'ok', text: 'Testbenachrichtigung wurde ausgelöst.' }
        : blockerNotice() ?? { tone: 'warn', text: 'Die Anzeige wurde vom System unterdrückt.' },
    )
  }

  const hint = blockerNotice()

  return (
    <div className="fade-in">
      <h2 className="view-title">Einstellungen</h2>

      <section className="settings__section">
        <h3 className="settings__heading">Konto</h3>
        <div className="account">
          {user.photoURL ? (
            <img className="account__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="account__avatar account__avatar--blank" aria-hidden="true">
              {(user.displayName ?? '?').slice(0, 1)}
            </div>
          )}
          <div className="account__body">
            <div className="account__name">{user.displayName ?? 'Angemeldet'}</div>
            <div className="account__mail">{user.email}</div>
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              onConfirm({
                title: 'Abmelden?',
                text: 'Deine Aufzeichnungen bleiben in deinem Konto. Beim nächsten Anmelden sind sie wieder da.',
                confirmLabel: 'Abmelden',
                onConfirm: () => void signOutUser(),
              })
            }
          >
            Abmelden
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__heading">Abend-Erinnerung</h3>
        <p className="settings__lead">
          Eine Benachrichtigung auf dem Sperrbildschirm, wenn der Abend beginnt. An Tagen, an denen
          du bereits reflektiert hast, bleibt es still.
        </p>

        <div className="settings__row">
          <label className="switch">
            <input
              type="checkbox"
              checked={reminder.enabled}
              disabled={busy || !pushConfigured}
              onChange={(e) => void toggle(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true">
              <span className="switch__knob" />
            </span>
            <span className="switch__label">Erinnerung einschalten</span>
          </label>
        </div>

        <div className="settings__row">
          <label className="settings__field">
            <span className="settings__label">Uhrzeit</span>
            <input
              type="time"
              className="time-input"
              value={reminder.time}
              onChange={(e) => onReminder({ time: e.target.value || '21:00' })}
            />
          </label>
          <span className="settings__meta">Zeitzone: {reminder.timeZone}</span>
        </div>

        <div className="settings__status">
          <span
            className={activeHere ? 'status-dot status-dot--on' : 'status-dot'}
            aria-hidden="true"
          />
          <span>
            {activeHere
              ? `Auf diesem Gerät (${deviceLabel()}) aktiv.`
              : `Auf diesem Gerät (${deviceLabel()}) noch nicht aktiv.`}
          </span>
        </div>

        {isIOS() && !isStandalone() && (
          <p className="settings__hint">
            Hinweis fürs iPhone: Lege die App zuerst über „Teilen → Zum Home-Bildschirm“ ab. Erst
            aus dieser installierten App heraus lassen sich Benachrichtigungen erlauben.
          </p>
        )}

        {hint && !activeHere && <p className="settings__hint">{hint.text}</p>}

        {notice && (
          <p className={notice.tone === 'ok' ? 'settings__ok' : 'settings__hint'} role="status">
            {notice.text}
          </p>
        )}

        {zoneDiffers && (
          <p className="settings__hint">
            Dieses Gerät steht in {deviceZone}, gespeichert ist {reminder.timeZone}. Die Erinnerung
            kommt dann zur falschen Stunde.{' '}
            <button
              type="button"
              className="btn-text"
              onClick={() => onReminder({ timeZone: deviceZone })}
            >
              Zeitzone dieses Geräts übernehmen
            </button>
          </p>
        )}

        <div className="settings__row">
          <button type="button" className="btn-outline" onClick={() => void test()} disabled={busy}>
            Testbenachrichtigung senden
          </button>
        </div>

        {/* Zugeklappt, weil es im Alltag niemanden interessiert: Es sind die Werte,
            die man sonst in der Firebase-Konsole zusammensuchen müsste, wenn eine
            Erinnerung ausbleibt. Ein Statusfenster, kein Alarm. */}
        <details className="diagnose" onToggle={(e) => openDiagnose(e.currentTarget.open)}>
          <summary className="diagnose__summary">Diagnose</summary>
          <dl className="diagnose__rows">
            <div className="diagnose__row">
              <dt className="diagnose__key">Berechtigung</dt>
              <dd className="diagnose__value">{permissionLabel(permission)}</dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Dieses Gerät</dt>
              <dd className="diagnose__value">{BLOCKER_LABELS[blocker]}</dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Als App installiert</dt>
              <dd className="diagnose__value">{isStandalone() ? 'ja' : 'nein'}</dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Erinnerung</dt>
              <dd className="diagnose__value">
                {reminder.enabled ? 'eingeschaltet' : 'ausgeschaltet'}, {reminder.time} Uhr
              </dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Zeitzone</dt>
              <dd className="diagnose__value">
                {reminder.timeZone}
                {zoneDiffers ? ` · dieses Gerät: ${deviceZone}` : ' · stimmt mit dem Gerät überein'}
              </dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Geräte im Verteiler</dt>
              <dd className="diagnose__value">
                {devices === null
                  ? 'wird geladen …'
                  : devices === 'unbekannt'
                    ? 'nicht abrufbar'
                    : String(devices)}
              </dd>
            </div>
            <div className="diagnose__row">
              <dt className="diagnose__key">Zuletzt verschickt</dt>
              <dd className="diagnose__value">
                {reminder.lastSentLocalDate ?? 'noch nie'}
                <span className="diagnose__note"> · wird vom Versand-Job geführt</span>
              </dd>
            </div>
          </dl>
        </details>
      </section>
    </div>
  )
}
