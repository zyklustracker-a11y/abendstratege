import { MAX_HIEBE } from '../../lib/constants'
import { emptyHieb } from '../../lib/factories'
import { areaLabel } from '../../lib/selectors'
import type { Area, Draft } from '../../lib/types'

interface Props {
  draft: Draft
  areas: Area[]
  update: (mutate: (draft: Draft) => void) => void
  onBack: () => void
  onFinish: () => void
}

/** Ein gemeinsamer Hieb-Schritt für den ganzen morgigen Tag – höchstens fünf, mindestens einer. */
export function HiebeStage({ draft, areas, update, onBack, onFinish }: Props) {
  const hiebe = draft.hiebe
  const used = new Set(hiebe.map((h) => h.text.trim()).filter(Boolean))
  const full = hiebe.length >= MAX_HIEBE
  const canFinish = hiebe.some((h) => h.text.trim())

  const inspiration = draft.reflections
    .map((reflection) => ({
      label: areaLabel(areas, reflection.areaId),
      steps: reflection.nextSteps.map((s) => s.trim()).filter((s) => s && !used.has(s)),
    }))
    .filter((group) => group.steps.length)

  const adopt = (text: string) =>
    update((d) => {
      const empty = d.hiebe.find((h) => !h.text.trim())
      if (empty) empty.text = text
      else if (d.hiebe.length < MAX_HIEBE) d.hiebe.push({ ...emptyHieb(), text })
    })

  return (
    <div className="fade-in--fast">
      <h2 className="step-title">Die Hiebe für morgen</h2>
      <p className="lead lead--wide lead--hiebe">
        Konkrete Handlungen für den morgigen Tag – gemischt aus allen Bereichen, die du heute
        reflektiert hast. Höchstens fünf, und auch einer genügt.
      </p>

      {inspiration.length > 0 && (
        <div className="card inspiration">
          <div className="eyebrow">Aus deinen Next Steps</div>
          <p className="inspiration__lead">
            Übernimm, was morgen zählt – oder formuliere etwas Eigenes.
          </p>
          {inspiration.map((group) => (
            <div className="inspiration__group" key={group.label}>
              <div className="inspiration__area">{group.label}</div>
              {group.steps.map((step, i) => (
                <div className="inspiration__row" key={i}>
                  <span className="inspiration__text">{step}</span>
                  <button
                    type="button"
                    className="btn-text inspiration__adopt"
                    disabled={full && !hiebe.some((h) => !h.text.trim())}
                    onClick={() => adopt(step)}
                  >
                    Übernehmen
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="hiebe">
        {hiebe.map((hieb, i) => (
          <div className="card hieb" key={hieb.id}>
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
              <button
                type="button"
                className="icon-btn icon-btn--quiet"
                title="Entfernen"
                aria-label={`Hieb ${i + 1} entfernen`}
                onClick={() =>
                  update((d) => {
                    d.hiebe.splice(i, 1)
                    if (!d.hiebe.length) d.hiebe = [emptyHieb()]
                  })
                }
              >
                ×
              </button>
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

      {!full && (
        <button
          type="button"
          className="btn-text btn-text--add"
          onClick={() =>
            update((d) => {
              d.hiebe.push(emptyHieb())
            })
          }
        >
          + Hieb hinzufügen
        </button>
      )}

      <div className="wizard__nav">
        <button type="button" className="btn-ghost" onClick={onBack}>
          Zurück
        </button>
        <button type="button" className="btn-primary" disabled={!canFinish} onClick={onFinish}>
          Reflexion abschließen
        </button>
      </div>
    </div>
  )
}
