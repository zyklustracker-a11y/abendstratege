import { activeAreas } from '../../lib/selectors'
import type { Area, AreaReflection } from '../../lib/types'

interface Props {
  areas: Area[]
  reflections: AreaReflection[]
  first: boolean
  onPick: (areaId: string) => void
  onOpen: (reflectionId: string) => void
  onToHiebe: () => void
  onBack: () => void
  onGoZiele: () => void
}

/** Auswahl des Lebensbereichs – bereits reflektierte sind markiert und bleiben anklickbar. */
export function PickAreaStage({
  areas,
  reflections,
  first,
  onPick,
  onOpen,
  onToHiebe,
  onBack,
  onGoZiele,
}: Props) {
  const visible = activeAreas(areas)

  return (
    <div className="fade-in--fast">
      <h2 className="step-title">
        {first ? 'In welchem Bereich hattest du heute einen Erfolg?' : 'Welcher Bereich als Nächstes?'}
      </h2>
      <p className="lead lead--wide">
        Wähle einen Lebensbereich. Du kannst danach beliebig viele weitere folgen lassen.
      </p>

      {visible.length > 0 ? (
        <div className="pick">
          {visible.map((area) => {
            const done = reflections.find((r) => r.areaId === area.id)
            return (
              <button
                type="button"
                key={area.id}
                className={done ? 'pick__item pick__item--done' : 'pick__item'}
                onClick={() => (done ? onOpen(done.id) : onPick(area.id))}
              >
                <div className="pick__body">
                  <div className="pick__name">{area.name.trim() || 'Ohne Namen'}</div>
                  <div className="pick__goal">
                    {done ? done.success.trim() || 'Noch ohne Erfolg' : area.goal.trim() || 'Noch kein Ziel hinterlegt'}
                  </div>
                </div>
                {done && (
                  <div className="pick__state">
                    <span className="pick__check" aria-hidden="true">
                      ✓
                    </span>
                    Reflektiert
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__title">Noch kein Lebensbereich angelegt.</div>
          <p className="empty-state__text empty-state__text--narrow">
            Lege unter „Meine Ziele“ deinen ersten Bereich an – er ist die Grundlage jeder
            Reflexion.
          </p>
          <button type="button" className="btn-outline" onClick={onGoZiele}>
            Zu meinen Zielen
          </button>
        </div>
      )}

      <div className="wizard__nav">
        <button type="button" className="btn-ghost" onClick={onBack}>
          Zurück
        </button>
        {reflections.length > 0 && (
          <button type="button" className="btn-primary" onClick={onToHiebe}>
            Weiter zu den Hieben
          </button>
        )}
      </div>
    </div>
  )
}
