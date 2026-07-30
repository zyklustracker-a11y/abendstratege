import { useEffect, useRef, useState } from 'react'
import { GOAL_PLACEHOLDERS, GOAL_PLACEHOLDER_FALLBACK } from '../lib/constants'
import { activeAreas } from '../lib/selectors'
import type { Area } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'

interface Props {
  areas: Area[]
  onRename: (areaId: string, name: string) => void
  onGoal: (areaId: string, goal: string) => void
  /** Legt einen Bereich an und gibt dessen id zurück, damit er den Fokus bekommt. */
  onAdd: () => string
  onRemove: (areaId: string) => void
  onConfirm: (request: ConfirmRequest) => void
}

/** Lebensbereiche und ihre Leitziele – eine Liste, weil beides zusammengehört. */
export function ZieleView({ areas, onRename, onGoal, onAdd, onRemove, onConfirm }: Props) {
  const visible = activeAreas(areas)

  // Ein neu angelegter Bereich ist namenlos und steht am Ende der Liste; ohne
  // Fokus bliebe unklar, wo weitergeschrieben wird – gerade auf dem Handy, wo
  // er unter dem Knopf aus dem Bild rutscht.
  const [focusId, setFocusId] = useState<string | null>(null)
  const names = useRef(new Map<string, HTMLInputElement>())
  useEffect(() => {
    if (!focusId) return
    names.current.get(focusId)?.focus()
    setFocusId(null)
  }, [focusId])

  return (
    <div className="fade-in">
      <h2 className="view-title">Meine Ziele</h2>
      <p className="ziele__lead">
        Deine Lebensbereiche und das jeweilige übergeordnete Ziel. Jeder Erfolg wird an ihnen
        gemessen – halte sie scharf. Änderungen werden sofort gespeichert.
      </p>

      <div className="fields fields--ziele">
        {visible.map((area) => (
          <div className="field area-field" key={area.id}>
            <div className="area-field__head">
              <input
                type="text"
                className="area-field__name"
                ref={(el) => {
                  if (el) names.current.set(area.id, el)
                  else names.current.delete(area.id)
                }}
                value={area.name}
                placeholder="Name des Lebensbereichs"
                aria-label="Name des Lebensbereichs"
                onChange={(e) => onRename(area.id, e.target.value)}
              />
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                title="Lebensbereich löschen"
                aria-label={`Lebensbereich ${area.name || 'ohne Namen'} löschen`}
                onClick={() =>
                  onConfirm({
                    title: 'Lebensbereich löschen?',
                    text: `„${area.name || 'Ohne Namen'}“ verschwindet aus der Auswahl und aus „Meine Ziele“. Bereits reflektierte Abende bleiben vollständig erhalten und zeigen den Bereich künftig als archiviert.`,
                    confirmLabel: 'Löschen',
                    onConfirm: () => onRemove(area.id),
                  })
                }
              >
                ×
              </button>
            </div>
            <textarea
              className="goal-textarea"
              rows={2}
              value={area.goal}
              placeholder={GOAL_PLACEHOLDERS[area.id] ?? GOAL_PLACEHOLDER_FALLBACK}
              aria-label={`Ziel für ${area.name || 'diesen Bereich'}`}
              onChange={(e) => onGoal(area.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">Noch kein Lebensbereich.</div>
          <p className="empty-state__text empty-state__text--narrow">
            Lege den ersten an – er ist die Grundlage jeder Reflexion.
          </p>
        </div>
      )}

      <button
        type="button"
        className="btn-text btn-text--add"
        onClick={() => setFocusId(onAdd())}
      >
        + Lebensbereich hinzufügen
      </button>
    </div>
  )
}
