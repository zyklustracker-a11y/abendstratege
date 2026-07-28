import type { View } from '../lib/types'

const NAV: ReadonlyArray<readonly [View, string]> = [
  ['reflect', 'Reflexion'],
  ['morgen', 'Morgen-Blick'],
  ['rueck', 'Rückblick'],
  ['ziele', 'Ziele'],
]

interface Props {
  view: View
  streak: number
  onNavigate: (view: View) => void
}

export function AppHeader({ view, streak, onNavigate }: Props) {
  return (
    <>
      <div className="topbar">
        <div className="brand">Der Abendstratege</div>
        {streak > 0 && (
          <div className="streak">
            <span className="streak__mark" aria-hidden="true">
              ◆
            </span>
            {streak === 1 ? '1 Tag in Folge' : `${streak} Tage in Folge`}
          </div>
        )}
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
