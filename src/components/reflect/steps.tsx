import { AREAS, LEVEL_QUESTIONS, areaLabel } from '../../lib/constants'
import type { AreaKey, Draft, Goals } from '../../lib/types'

export interface StepProps {
  draft: Draft
  update: (mutate: (draft: Draft) => void) => void
}

/** Schritt A – Haupterfolg und Lebensbereich. */
export function StepSuccess({ draft, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Dein größter Erfolg heute</h2>
      <p className="lead">Ein Satz genügt. Konkret, nicht bescheiden.</p>
      <textarea
        className="textarea-block textarea-block--lg"
        rows={3}
        value={draft.success}
        placeholder="Mein größter Erfolg heute war …"
        onChange={(e) => {
          const value = e.target.value
          update((d) => {
            d.success = value
          })
        }}
      />
      <div className="eyebrow eyebrow--muted area-label">Lebensbereich</div>
      <div className="chips">
        {AREAS.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={draft.area === key ? 'chip chip--active' : 'chip'}
            aria-pressed={draft.area === key}
            onClick={() =>
              update((d) => {
                d.area = key
              })
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Schritt B – die fünf Ebenen der Vertiefung. */
export function StepLevels({ draft, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Die fünf Ebenen</h2>
      <p className="lead lead--wide lead--gap-lg">
        Bohre tiefer. Jede Ebene führt dich näher an den Kern deines Erfolgs.
      </p>
      <div className="levels">
        {LEVEL_QUESTIONS.map((question, i) => (
          <div className="level" key={i}>
            <label className="eyebrow" htmlFor={`level-${i}`}>
              Ebene {i + 1}
            </label>
            <textarea
              id={`level-${i}`}
              className="level-textarea"
              rows={2}
              value={draft.levels[i] ?? ''}
              placeholder={question}
              onChange={(e) => {
                const value = e.target.value
                update((d) => {
                  d.levels[i] = value
                })
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Schritt C – Warum: der Erfolg im Licht des Leitziels. */
export function StepWhy({ draft, update, goals }: StepProps & { goals: Goals }) {
  const goal = draft.area ? goals[draft.area].trim() : ''
  return (
    <div className="fade-in--fast">
      <h2 className="step-title step-title--alone">Warum ist es ein Erfolg?</h2>
      <div className="card goal-card">
        <div className="eyebrow">{areaLabel(draft.area) || 'Lebensbereich'} · Dein Leitziel</div>
        <div className="goal-card__text">
          {goal || 'Noch kein Ziel für diesen Bereich hinterlegt.'}
        </div>
      </div>
      <p className="lead lead--gap-sm">
        Warum bringt dich dieser Erfolg diesem Ziel näher?
      </p>
      <textarea
        className="textarea-block"
        rows={4}
        value={draft.why}
        placeholder="Dieser Erfolg zahlt auf mein Ziel ein, weil …"
        onChange={(e) => {
          const value = e.target.value
          update((d) => {
            d.why = value
          })
        }}
      />
    </div>
  )
}

/** Schritt D – Ausweiten. */
export function StepExpand({ draft, update }: StepProps) {
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
        value={draft.expand}
        placeholder="Kurz und konkret."
        onChange={(e) => {
          const value = e.target.value
          update((d) => {
            d.expand = value
          })
        }}
      />
    </div>
  )
}

/** Schritt E – Next Steps als dynamische Liste. */
export function StepNextSteps({ draft, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Next Steps</h2>
      <p className="lead">Welche konkreten nächsten Schritte ergeben sich daraus?</p>
      <div className="rows">
        {draft.nextSteps.map((value, i) => (
          <div className="row" key={i}>
            <input
              type="text"
              className="text-input row__input"
              value={value}
              placeholder="Nächster Schritt …"
              aria-label={`Nächster Schritt ${i + 1}`}
              onChange={(e) => {
                const next = e.target.value
                update((d) => {
                  d.nextSteps[i] = next
                })
              }}
            />
            <button
              type="button"
              className="icon-btn"
              title="Entfernen"
              aria-label={`Schritt ${i + 1} entfernen`}
              onClick={() =>
                update((d) => {
                  d.nextSteps.splice(i, 1)
                  if (!d.nextSteps.length) d.nextSteps = ['']
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
          update((d) => {
            d.nextSteps.push('')
          })
        }
      >
        + Schritt hinzufügen
      </button>
    </div>
  )
}

/** Schritt F – die fünf Hiebe für den nächsten Tag. */
export function StepHiebe({ draft, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Die fünf Hiebe für morgen</h2>
      <p className="lead lead--wide lead--hiebe">
        Fünf konkrete Handlungen für den morgigen Tag. Das ist das Ergebnis deines Abends –
        Zeitpunkt optional.
      </p>
      <div className="hiebe">
        {draft.hiebe.map((hieb, i) => (
          <div className="card hieb" key={i}>
            <div className="hieb__head">
              <div className="hieb__n" aria-hidden="true">
                {i + 1}
              </div>
              <input
                type="text"
                className="hieb__input"
                value={hieb.text}
                placeholder="Konkrete Handlung …"
                aria-label={`Hieb ${i + 1}`}
                onChange={(e) => {
                  const value = e.target.value
                  update((d) => {
                    d.hiebe[i].text = value
                  })
                }}
              />
            </div>
            <div className="hieb__meta">
              <select
                className="mini-select"
                value={hieb.slot}
                aria-label={`Tagesabschnitt für Hieb ${i + 1}`}
                onChange={(e) => {
                  const value = e.target.value
                  update((d) => {
                    d.hiebe[i].slot = value
                  })
                }}
              >
                <option value="">Tagesabschnitt</option>
                <option value="Morgens">Morgens</option>
                <option value="Mittags">Mittags</option>
                <option value="Abends">Abends</option>
              </select>
              <input
                type="time"
                className="time-input"
                value={hieb.time}
                aria-label={`Uhrzeit für Hieb ${i + 1}`}
                onChange={(e) => {
                  const value = e.target.value
                  update((d) => {
                    d.hiebe[i].time = value
                  })
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Optionaler Schritt – weitere Erfolge in Kurzform. */
export function StepExtras({ draft, update }: StepProps) {
  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Weitere Erfolge</h2>
      <p className="lead lead--wide">
        Optional: Was ist dir heute sonst noch gelungen? In Kurzform, ohne Vertiefung.
      </p>
      <div className="rows">
        {draft.extras.map((extra, i) => (
          <div className="row row--wrap" key={i}>
            <input
              type="text"
              className="text-input row__input row__input--extra"
              value={extra.text}
              placeholder="Weiterer Erfolg …"
              aria-label={`Weiterer Erfolg ${i + 1}`}
              onChange={(e) => {
                const value = e.target.value
                update((d) => {
                  d.extras[i].text = value
                })
              }}
            />
            <select
              className="area-select"
              value={extra.area}
              aria-label={`Lebensbereich für weiteren Erfolg ${i + 1}`}
              onChange={(e) => {
                const value = e.target.value as AreaKey | ''
                update((d) => {
                  d.extras[i].area = value
                })
              }}
            >
              <option value="">Bereich</option>
              {AREAS.map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn"
              title="Entfernen"
              aria-label={`Weiteren Erfolg ${i + 1} entfernen`}
              onClick={() =>
                update((d) => {
                  d.extras.splice(i, 1)
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
          update((d) => {
            d.extras.push({ text: '', area: '' })
          })
        }
      >
        + Erfolg hinzufügen
      </button>
    </div>
  )
}
