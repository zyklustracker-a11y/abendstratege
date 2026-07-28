import { SyncBadge } from './SyncBadge'
import type { SyncStatus, View } from '../lib/types'

const NAV: ReadonlyArray<readonly [View, string]> = [
  ['reflect', 'Reflexion'],
  ['morgen', 'Morgen-Blick'],
  ['rueck', 'Rückblick'],
  ['ziele', 'Ziele'],
]

interface Props {
  view: View
  streak: number
  status: SyncStatus
  onNavigate: (view: View) => void
}

export function AppHeader({ view, streak, status, onNavigate }: Props) {
  return (
    <>
      <div className="topbar">
        <div className="brand">Der Abendstratege</div>
        <div className="topbar__side">
          <SyncBadge status={status} />
          {streak > 0 && (
            <div className="streak">
              <span className="streak__mark" aria-hidden="true">
                ◆
              </span>
              {streak === 1 ? '1 Tag in Folge' : `${streak} Tage in Folge`}
            </div>
          )}
          <button
            type="button"
            className={
              view === 'einstellungen' ? 'gear-btn gear-btn--active' : 'gear-btn'
            }
            aria-label="Einstellungen"
            aria-current={view === 'einstellungen' ? 'page' : undefined}
            title="Einstellungen"
            onClick={() => onNavigate('einstellungen')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
              />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.1 13.9a1.5 1.5 0 0 0 .3 1.6l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-1.6-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.6.3l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0 .3-1.6 1.5 1.5 0 0 0-1.4-.9h-.2a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.6l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.6.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.6-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.6v.1a1.5 1.5 0 0 0 1.4.9h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <nav className="nav">
        {NAV.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={key === view ? 'nav__item nav__item--active' : 'nav__item'}
            aria-current={key === view ? 'page' : undefined}
            onClick={() => onNavigate(key)}
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
