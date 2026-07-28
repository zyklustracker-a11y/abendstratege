import { useState } from 'react'
import { GOAL_PLACEHOLDERS, GOAL_PLACEHOLDER_FALLBACK } from '../lib/constants'
import type { Area } from '../lib/types'

interface Props {
  areas: Area[]
  onFinish: (goals: Record<string, string>) => void
}

/** Einmaliger erster Start: je ein Leitziel für die fünf vorgeschlagenen Bereiche. */
export function SetupScreen({ areas, onFinish }: Props) {
  const [goals, setGoals] = useState<Record<string, string>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, a.goal])),
  )
  const ready = areas.every((a) => (goals[a.id] ?? '').trim())

  return (
    <div className="setup fade-in--slow">
      <div className="setup__eyebrow">Der Abendstratege</div>
      <h1 className="setup__title">
        Bevor du beginnst:
        <br />
        deine fünf Leitziele.
      </h1>
      <p className="setup__lead">
        Definiere je ein übergeordnetes Ziel in fünf Lebensbereichen. Sie sind das Fundament dieser
        App – jeder Erfolg wird später an ihnen gemessen. Bereiche und Ziele kannst du später
        jederzeit ändern, ergänzen oder entfernen.
      </p>

      <div className="fields">
        {areas.map((area) => (
          <div className="field" key={area.id}>
            <label className="eyebrow" htmlFor={`setup-${area.id}`}>
              {area.name}
            </label>
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
        onClick={() => ready && onFinish(goals)}
      >
        Meine Ziele festhalten
      </button>
      <p className="setup__hint">Alle fünf Bereiche brauchen ein Ziel.</p>
    </div>
  )
}
