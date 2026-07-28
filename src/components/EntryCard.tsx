import { LEVEL_QUESTIONS, areaLabel } from '../lib/constants'
import { formatShort } from '../lib/date'
import { hiebMeta } from '../lib/selectors'
import type { Entry } from '../lib/types'

interface Props {
  entry: Entry
  expanded: boolean
  onToggle: () => void
}

/** Ein Archiveintrag – Kopfzeile immer sichtbar, Details aufklappbar. */
export function EntryCard({ entry, expanded, onToggle }: Props) {
  const levels = LEVEL_QUESTIONS.map((q, i) => ({ q, a: (entry.levels[i] ?? '').trim() })).filter(
    (l) => l.a,
  )
  const hiebe = (entry.hiebe ?? []).filter((h) => h.text.trim())
  const nextSteps = entry.nextSteps ?? []
  const extras = entry.extras ?? []

  return (
    <div className="entry">
      <button type="button" className="entry__head" aria-expanded={expanded} onClick={onToggle}>
        <div className="entry__main">
          <div className="entry__meta">
            <span className="entry__date">{formatShort(entry.date)}</span>
            <span className="entry__badge">{areaLabel(entry.area) || '—'}</span>
          </div>
          <div className="entry__success">{entry.success}</div>
        </div>
        <div className="entry__chevron" aria-hidden="true">
          {expanded ? '–' : '+'}
        </div>
      </button>

      {expanded && (
        <div className="entry__body">
          {levels.length > 0 && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title entry__section-title--levels">
                Die fünf Ebenen
              </div>
              <div className="entry__qa">
                {levels.map((level, i) => (
                  <div key={i}>
                    <div className="entry__q">{level.q}</div>
                    <div className="entry__a">{level.a}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {entry.why?.trim() && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title entry__section-title--text">
                Warum es ein Erfolg ist
              </div>
              <div className="entry__text">{entry.why}</div>
            </>
          )}

          {entry.expand?.trim() && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title entry__section-title--text">
                Ausweiten
              </div>
              <div className="entry__text">{entry.expand}</div>
            </>
          )}

          {nextSteps.length > 0 && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title">
                Next Steps
              </div>
              <div className="entry__list">
                {nextSteps.map((step, i) => (
                  <div className="entry__li" key={i}>
                    <span className="entry__dash">–</span>
                    {step}
                  </div>
                ))}
              </div>
            </>
          )}

          {hiebe.length > 0 && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title">
                Die fünf Hiebe
              </div>
              <div className="entry__list entry__list--hiebe">
                {hiebe.map((hieb, i) => (
                  <div className="entry__li entry__li--baseline" key={i}>
                    <span className={hieb.done ? 'entry__mark entry__mark--done' : 'entry__mark'}>
                      {hieb.done ? '✓' : '○'}
                    </span>
                    <span>
                      {hieb.text} <span className="meta-note">{hiebMeta(hieb)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {extras.length > 0 && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title">
                Weitere Erfolge
              </div>
              <div className="entry__list">
                {extras.map((extra, i) => (
                  <div className="entry__li entry__li--baseline" key={i}>
                    <span className="diamond">◆</span>
                    <span>
                      {extra.text} <span className="meta-note">{areaLabel(extra.area)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
