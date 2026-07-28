import { useState } from 'react'
import { AREAS, EMPTY_GOALS } from '../lib/constants'
import type { AreaKey, Goals } from '../lib/types'
import { GoalFields } from './GoalFields'

/** Einmaliger erster Start: die fünf Leitziele festhalten. */
export function SetupScreen({ onFinish }: { onFinish: (goals: Goals) => void }) {
  const [draft, setDraft] = useState<Goals>(() => ({ ...EMPTY_GOALS }))
  const ready = AREAS.every(([key]) => draft[key].trim())

  const update = (area: AreaKey, value: string) =>
    setDraft((current) => ({ ...current, [area]: value }))

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
        App – jeder Erfolg wird später an ihnen gemessen. Du kannst sie jederzeit anpassen.
      </p>

      <GoalFields idPrefix="setup" values={draft} onChange={update} />

      <button
        type="button"
        className="btn-primary setup__submit"
        disabled={!ready}
        onClick={() => ready && onFinish(draft)}
      >
        Meine Ziele festhalten
      </button>
      <p className="setup__hint">Alle fünf Bereiche brauchen ein Ziel.</p>
    </div>
  )
}
