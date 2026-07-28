import { formatShort } from '../lib/date'
import { hiebMeta, sortedDesc } from '../lib/selectors'
import type { Entry } from '../lib/types'

interface Props {
  entries: Entry[]
  onToggle: (index: number) => void
  onGoReflect: () => void
}

/** Die fünf Hiebe der jüngsten Reflexion – abhakbar. */
export function MorgenView({ entries, onToggle, onGoReflect }: Props) {
  const latest = sortedDesc(entries)[0]
  const hiebe = (latest?.hiebe ?? [])
    .map((hieb, index) => ({ hieb, index }))
    .filter(({ hieb }) => hieb.text.trim())
  const done = hiebe.filter(({ hieb }) => hieb.done).length

  return (
    <div className="fade-in">
      <h2 className="view-title">Morgen-Blick</h2>

      {hiebe.length > 0 && latest ? (
        <>
          <p className="morgen__lead">
            Deine fünf Hiebe aus der Reflexion vom {formatShort(latest.date)}.
          </p>
          <div className="morgen__list">
            {hiebe.map(({ hieb, index }) => {
              const meta = hiebMeta(hieb)
              return (
                <button
                  type="button"
                  key={index}
                  className="morgen__item"
                  aria-pressed={hieb.done}
                  onClick={() => onToggle(index)}
                >
                  <div
                    className={hieb.done ? 'morgen__check morgen__check--done' : 'morgen__check'}
                    aria-hidden="true"
                  >
                    {hieb.done ? '✓' : ''}
                  </div>
                  <div className="morgen__body">
                    <div className={hieb.done ? 'morgen__text morgen__text--done' : 'morgen__text'}>
                      {hieb.text}
                    </div>
                    {meta && <div className="morgen__meta">{meta}</div>}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="morgen__progress">
            {done} von {hiebe.length} umgesetzt
          </p>
        </>
      ) : (
        <div className="empty-state morgen__empty">
          <div className="empty-state__title">Noch keine Hiebe formuliert.</div>
          <p className="empty-state__text">
            Deine erste Abendreflexion legt die fünf Hiebe für den nächsten Tag fest.
          </p>
          <button type="button" className="btn-outline" onClick={onGoReflect}>
            Heute Abend reflektieren
          </button>
        </div>
      )}
    </div>
  )
}
