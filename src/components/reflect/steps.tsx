import { LEVEL_QUESTIONS } from '../../lib/constants'
import type { Area, AreaReflection } from '../../lib/types'

export interface StepProps {
  reflection: AreaReflection
  update: (mutate: (reflection: AreaReflection) => void) => void
}

/** Schritt 1 – der Erfolg selbst. */
export function StepSuccess({ reflection, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Dein Erfolg heute</h2>
      <p className="lead">Ein Satz genügt. Konkret, nicht bescheiden.</p>
      <textarea
        className="textarea-block textarea-block--lg"
        rows={3}
        value={reflection.success}
        placeholder="Mein Erfolg in diesem Bereich war …"
        onChange={(e) => {
          const value = e.target.value
          update((r) => {
            r.success = value
          })
        }}
      />
    </div>
  )
}

/** Schritt 2 – die fünf Ebenen der Vertiefung. */
export function StepLevels({ reflection, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Die fünf Ebenen</h2>
      <p className="lead lead--wide lead--gap-lg">
        Bohre tiefer. Jede Ebene führt dich näher an den Kern deines Erfolgs.
      </p>
      <div className="levels">
        {LEVEL_QUESTIONS.map((question, i) => (
          <div className="level" key={i}>
            <label className="eyebrow" htmlFor={`level-${reflection.id}-${i}`}>
              Ebene {i + 1}
            </label>
            <textarea
              id={`level-${reflection.id}-${i}`}
              className="level-textarea"
              rows={2}
              value={reflection.levels[i] ?? ''}
              placeholder={question}
              onChange={(e) => {
                const value = e.target.value
                update((r) => {
                  r.levels[i] = value
                })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Schritt 3 – Warum: der Erfolg im Licht des Leitziels. */
export function StepWhy({ reflection, update, area }: StepProps & { area: Area | undefined }) {
  const goal = (area?.goal ?? '').trim()
  return (
    <div className="fade-in--fast">
      <h2 className="step-title step-title--alone">Warum ist es ein Erfolg?</h2>
      <div className="card goal-card">
        <div className="eyebrow">{area?.name?.trim() || 'Lebensbereich'} · Dein Leitziel</div>
        <div className="goal-card__text">
          {goal || 'Noch kein Ziel für diesen Bereich hinterlegt.'}
        </div>
      </div>
      <p className="lead lead--gap-sm">Warum bringt dich dieser Erfolg diesem Ziel näher?</p>
      <textarea
        className="textarea-block"
        rows={4}
        value={reflection.why}
        placeholder="Dieser Erfolg zahlt auf mein Ziel ein, weil …"
        onChange={(e) => {
          const value = e.target.value
          update((r) => {
            r.why = value
          })
        }}
      />
    </div>
  )
}

/** Schritt 4 – Ausweiten. */
export function StepExpand({ reflection, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Ausweiten</h2>
      <p className="lead lead--wide">
        Wie kannst du diesen Erfolg ausweiten oder wiederholen? Bleib pragmatisch – ein bis zwei
        Sätze.
      </p>
      <textarea
        className="textarea-block"
        rows={2}
        value={reflection.expand}
        placeholder="Kurz und konkret."
        onChange={(e) => {
          const value = e.target.value
          update((r) => {
            r.expand = value
          })
        }}
      />
    </div>
  )
}

/** Schritt 5 – Next Steps; sie speisen später die Hiebe. */
export function StepNextSteps({ reflection, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Next Steps</h2>
      <p className="lead lead--wide">
        Welche konkreten nächsten Schritte ergeben sich daraus? Sie dienen dir später als Vorlage
        für die Hiebe.
      </p>
      <div className="rows">
        {reflection.nextSteps.map((value, i) => (
          <div className="row" key={i}>
            <input
              type="text"
              className="text-input row__input"
              value={value}
              placeholder="Nächster Schritt …"
              aria-label={`Nächster Schritt ${i + 1}`}
              onChange={(e) => {
                const next = e.target.value
                update((r) => {
                  r.nextSteps[i] = next
                })
              }}
            />
            <button
              type="button"
              className="icon-btn"
              title="Entfernen"
              aria-label={`Schritt ${i + 1} entfernen`}
              onClick={() =>
                update((r) => {
                  r.nextSteps.splice(i, 1)
                  if (!r.nextSteps.length) r.nextSteps = ['']
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-text btn-text--add"
        onClick={() =>
          update((r) => {
            r.nextSteps.push('')
          })
        }
      >
        + Schritt hinzufügen
      </button>
    </div>
  )
}
