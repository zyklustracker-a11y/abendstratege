import { useState } from 'react'
import { LEVEL_QUESTIONS } from '../lib/constants'
import { formatShort } from '../lib/date'
import { areaLabel, hiebMeta } from '../lib/selectors'
import type { Area, AreaReflection, Entry } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'

interface Props {
  entry: Entry
  areas: Area[]
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onInsight: (insight: string) => void
  onConfirm: (request: ConfirmRequest) => void
}

/** Ein Abend im Archiv: alle Bereiche einzeln aufklappbar, mit Platz für eine Erkenntnis. */
export function EntryCard({
  entry,
  areas,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onInsight,
  onConfirm,
}: Props) {
  const [openReflections, setOpenReflections] = useState<string[]>([])

  return (
    <div className="entry">
      <button type="button" className="entry__head" aria-expanded={expanded} onClick={onToggle}>
        <div className="entry__main">
          <div className="entry__meta">
            <span className="entry__date">{formatShort(entry.date)}</span>
            {entry.reflections.map((reflection) => (
              <span className="entry__badge" key={reflection.id}>
                {areaLabel(areas, reflection.areaId)}
              </span>
            ))}
          </div>
          <div className="entry__success">
            {entry.reflections[0]?.success || 'Ohne Erfolg festgehalten'}
          </div>
        </div>
        <div className="entry__chevron" aria-hidden="true">
          {expanded ? '–' : '+'}
        </div>
      </button>

      {expanded && (
        <div className="entry__body">
          {entry.reflections.map((reflection) => (
            <ReflectionBlock
              key={reflection.id}
              reflection={reflection}
              areas={areas}
              open={openReflections.includes(reflection.id)}
              onToggle={() =>
                setOpenReflections((current) =>
                  current.includes(reflection.id)
                    ? current.filter((id) => id !== reflection.id)
                    : [...current, reflection.id],
                )
              }
            />
          ))}

          {entry.hiebe.length > 0 && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title">
                Die Hiebe
              </div>
              <div className="entry__list entry__list--hiebe">
                {entry.hiebe.map((hieb) => (
                  <div className="entry__li entry__li--baseline" key={hieb.id}>
                    <span className={hieb.done ? 'entry__mark entry__mark--done' : 'entry__mark'}>
                      {hieb.done ? '✓' : '○'}
                    </span>
                    <span>
                      {hieb.text} <span className="meta-note">{hiebMeta(hieb)}</span>
                      {hieb.source === 'extra' && (
                        <span className="meta-note"> · später ergänzt</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title">Erkenntnis</div>
          <textarea
            className="level-textarea entry__insight"
            rows={2}
            value={entry.insight}
            placeholder="Fällt dir beim Zurücklesen ein Muster auf? Notiere es hier."
            aria-label={`Erkenntnis zum ${formatShort(entry.date)}`}
            onChange={(e) => onInsight(e.target.value)}
          />

          <div className="entry__actions">
            <button type="button" className="btn-text" onClick={onEdit}>
              Diesen Abend bearbeiten
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--quiet"
              title="Eintrag löschen"
              aria-label={`Eintrag vom ${formatShort(entry.date)} löschen`}
              onClick={() =>
                onConfirm({
                  title: 'Eintrag löschen?',
                  text: `Der Abend vom ${formatShort(entry.date)} wird mit allen Bereichen, Vertiefungen und Hieben entfernt. Das lässt sich nicht rückgängig machen.`,
                  confirmLabel: 'Löschen',
                  onConfirm: onDelete,
                })
              }
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface BlockProps {
  reflection: AreaReflection
  areas: Area[]
  open: boolean
  onToggle: () => void
}

/** Ein Bereichs-Durchlauf innerhalb eines Abends. */
function ReflectionBlock({ reflection, areas, open, onToggle }: BlockProps) {
  const levels = LEVEL_QUESTIONS.map((q, i) => ({ q, a: (reflection.levels[i] ?? '').trim() })).filter(
    (l) => l.a,
  )
  const nextSteps = reflection.nextSteps.filter((s) => s.trim())

  return (
    <div className="reflection">
      <button type="button" className="reflection__head" aria-expanded={open} onClick={onToggle}>
        <div className="reflection__main">
          <div className="eyebrow">{areaLabel(areas, reflection.areaId)}</div>
          <div className="reflection__success">{reflection.success}</div>
        </div>
        <div className="entry__chevron" aria-hidden="true">
          {open ? '–' : '+'}
        </div>
      </button>

      {open && (
        <div className="reflection__body">
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

          {reflection.why.trim() && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title entry__section-title--text">
                Warum es ein Erfolg ist
              </div>
              <div className="entry__text">{reflection.why}</div>
            </>
          )}

          {reflection.expand.trim() && (
            <>
              <div className="eyebrow eyebrow--sm eyebrow--muted entry__section-title entry__section-title--text">
                Ausweiten
              </div>
              <div className="entry__text">{reflection.expand}</div>
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
        </div>
      )}
    </div>
  )
}
