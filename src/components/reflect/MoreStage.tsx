import { areaLabel } from '../../lib/selectors'
import type { Area, AreaReflection } from '../../lib/types'

interface Props {
  areas: Area[]
  reflections: AreaReflection[]
  onEdit: (reflectionId: string) => void
  onDelete: (reflection: AreaReflection) => void
  onAnother: () => void
  onToHiebe: () => void
}

/** Zwischenfrage nach jedem Durchlauf: noch ein Bereich – oder weiter zu den Hieben? */
export function MoreStage({ areas, reflections, onEdit, onDelete, onAnother, onToHiebe }: Props) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Hattest du heute noch einen Erfolg in einem anderen Bereich?</h2>
      <p className="lead lead--wide">
        Du kannst so viele Bereiche reflektieren, wie du möchtest. Die Hiebe für morgen kommen erst
        danach – einmal für den ganzen Tag.
      </p>

      <div className="summary">
        {reflections.map((reflection) => (
          <div className="card summary__item" key={reflection.id}>
            <div className="summary__body">
              <div className="eyebrow">{areaLabel(areas, reflection.areaId)}</div>
              <div className="summary__text">{reflection.success.trim() || 'Ohne Erfolg'}</div>
            </div>
            <div className="summary__actions">
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                title="Bearbeiten"
                aria-label="Diesen Durchlauf bearbeiten"
                onClick={() => onEdit(reflection.id)}
              >
                ✎
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                title="Entfernen"
                aria-label="Diesen Durchlauf entfernen"
                onClick={() => onDelete(reflection)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="wizard__nav">
        <button type="button" className="btn-ghost" onClick={onAnother}>
          Ja, weiterer Bereich
        </button>
        <button type="button" className="btn-primary" onClick={onToHiebe}>
          Nein, weiter zu den Hieben
        </button>
      </div>
    </div>
  )
}
