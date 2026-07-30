import { useState } from 'react'
import { GOAL_PLACEHOLDERS, GOAL_PLACEHOLDER_FALLBACK } from '../lib/constants'
import type { Area } from '../lib/types'
import { KonzeptText } from './KonzeptText'

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

/**
 * Einmaliger erster Start, in zwei Schritten: erst worum es geht, dann die
 * Leitziele. Wer den Abendstrategen nicht kennt, wüsste sonst nicht, worauf er
 * sich einlässt – und warum ausgerechnet Ziele der erste Schritt sind. Der
 * Schritt ist bewusst nur lokaler Zustand: Er überlebt kein Neuladen, und das
 * ist richtig so, weil dabei ohnehin nichts verloren geht.
 */
export function SetupScreen({ areas, onFinish }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [goals, setGoals] = useState<Record<string, string>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, a.goal])),
  )
  // Wer einen Vorschlag hier schon aussortiert, muss ihm kein Ziel geben. Nur
  // lokal: Geschrieben wird die Auswahl erst beim Abschluss.
  const [removed, setRemoved] = useState<string[]>([])

  const visible = areas.filter((a) => !removed.includes(a.id))
  const missing = visible.filter((a) => !(goals[a.id] ?? '').trim()).length
  const ready = visible.length > 0 && missing === 0

  if (step === 1) {
    return (
      <div className="setup fade-in--slow">
        <div className="setup__eyebrow">Der Abendstratege</div>
        <div className="eyebrow eyebrow--muted setup__step">Schritt 1 von 2</div>
        <h1 className="setup__title">Worum es hier geht.</h1>

        <KonzeptText />

        <button
          type="button"
          className="btn-primary setup__submit"
          onClick={() => setStep(2)}
        >
          Verstanden – los geht’s
        </button>
      </div>
    )
  }

  return (
    <div className="setup fade-in">
      <div className="setup__eyebrow">Der Abendstratege</div>
      <div className="eyebrow eyebrow--muted setup__step">Schritt 2 von 2</div>
      <h1 className="setup__title">
        Bevor du beginnst:
        <br />
        {visible.length === 1 ? 'dein Leitziel.' : `deine ${word(visible.length)} Leitziele.`}
      </h1>
      <p className="setup__lead">
        {visible.length === 1
          ? 'Definiere ein übergeordnetes Ziel für diesen Lebensbereich. Es ist das Fundament dieser App – jeder Erfolg wird später an ihm gemessen.'
          : `Definiere je ein übergeordnetes Ziel in diesen ${word(visible.length)} Lebensbereichen. Sie sind das Fundament dieser App – jeder Erfolg wird später an ihnen gemessen.`}{' '}
        Jeder Erfolg, den du abends festhältst, wird an genau diesen Zielen gemessen – deshalb
        beginnt hier alles. Bereiche und Ziele kannst du später jederzeit ändern, ergänzen oder
        entfernen. Was du nicht brauchst, nimm gleich heraus.
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

      <div className="setup__back">
        <button type="button" className="btn-text" onClick={() => setStep(1)}>
          Zurück zur Erklärung
        </button>
      </div>
    </div>
  )
}
