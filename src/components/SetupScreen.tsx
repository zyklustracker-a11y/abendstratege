import { useState } from 'react'
import { GOAL_PLACEHOLDERS, GOAL_PLACEHOLDER_FALLBACK } from '../lib/constants'
import type { Area } from '../lib/types'

interface Props {
  areas: Area[]
  onFinish: (goals: Record<string, string>, keptAreaIds: string[]) => void
}

/**
 * Kleine Zahlwörter, damit die Texte sich der Länge der Vorgabeliste anpassen,
 * ohne in Ziffern zu verfallen. Darüber hinaus schreibt niemand mehr aus.
 */
const WORDS = [
  'null',
  'ein',
  'zwei',
  'drei',
  'vier',
  'fünf',
  'sechs',
  'sieben',
  'acht',
  'neun',
  'zehn',
  'elf',
  'zwölf',
]

function word(n: number): string {
  return WORDS[n] ?? String(n)
}

/** Einmaliger erster Start: je ein Leitziel für die vorgeschlagenen Bereiche. */
export function SetupScreen({ areas, onFinish }: Props) {
  const [goals, setGoals] = useState<Record<string, string>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, a.goal])),
  )
  // Wer einen Vorschlag hier schon aussortiert, muss ihm kein Ziel geben. Nur
  // lokal: Geschrieben wird die Auswahl erst beim Abschluss.
  const [removed, setRemoved] = useState<string[]>([])

  const visible = areas.filter((a) => !removed.includes(a.id))
  const missing = visible.filter((a) => !(goals[a.id] ?? '').trim()).length
  const ready = visible.length > 0 && missing === 0

  return (
    <div className="setup fade-in--slow">
      <div className="setup__eyebrow">Der Abendstratege</div>
      <h1 className="setup__title">
        Bevor du beginnst:
        <br />
        {visible.length === 1 ? 'dein Leitziel.' : `deine ${word(visible.length)} Leitziele.`}
      </h1>
      <p className="setup__lead">
        {visible.length === 1
          ? 'Definiere ein übergeordnetes Ziel für diesen Lebensbereich. Es ist das Fundament dieser App – jeder Erfolg wird später an ihm gemessen.'
          : `Definiere je ein übergeordnetes Ziel in diesen ${word(visible.length)} Lebensbereichen. Sie sind das Fundament dieser App – jeder Erfolg wird später an ihnen gemessen.`}{' '}
        Bereiche und Ziele kannst du später jederzeit ändern, ergänzen oder entfernen. Was du nicht
        brauchst, nimm gleich heraus.
      </p>

      <div className="fields fields--setup">
        {visible.map((area) => (
          <div className="field" key={area.id}>
            <div className="setup__field-head">
              <label className="eyebrow setup__field-label" htmlFor={`setup-${area.id}`}>
                {area.name}
              </label>
              {visible.length > 1 && (
                <button
                  type="button"
                  className="icon-btn icon-btn--quiet"
                  title="Lebensbereich entfernen"
                  aria-label={`Lebensbereich ${area.name} entfernen`}
                  onClick={() => setRemoved((current) => [...current, area.id])}
                >
                  ×
                </button>
              )}
            </div>
            <textarea
              id={`setup-${area.id}`}
              className="goal-textarea"
              rows={2}
              value={goals[area.id] ?? ''}
              placeholder={GOAL_PLACEHOLDERS[area.id] ?? GOAL_PLACEHOLDER_FALLBACK}
              onChange={(e) => setGoals((current) => ({ ...current, [area.id]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-primary setup__submit"
        disabled={!ready}
        onClick={() => ready && onFinish(goals, visible.map((a) => a.id))}
      >
        Meine Ziele festhalten
      </button>
      <p className="setup__hint">
        {missing === 0
          ? 'Jeder Bereich hat ein Ziel.'
          : missing === 1
            ? 'Noch ein Ziel fehlt.'
            : `Noch ${word(missing)} Ziele fehlen.`}
      </p>
    </div>
  )
}
