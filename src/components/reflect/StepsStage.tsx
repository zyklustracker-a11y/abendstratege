import { EXTRAS_STEP, STEP_COUNT } from '../../lib/constants'
import type { Draft, Goals } from '../../lib/types'
import {
  StepExpand,
  StepExtras,
  StepHiebe,
  StepLevels,
  StepNextSteps,
  StepSuccess,
  StepWhy,
} from './steps'

interface Props {
  draft: Draft
  goals: Goals
  step: number
  update: (mutate: (draft: Draft) => void) => void
  onStep: (step: number) => void
  /** Zurück aus Schritt A führt wieder auf den Auftakt. */
  onLeave: () => void
  onFinish: () => void
}

export function StepsStage({ draft, goals, step, update, onStep, onLeave, onFinish }: Props) {
  const isExtras = step === EXTRAS_STEP
  // Nur Schritt A ist Pflicht: ohne Erfolg und Lebensbereich trägt der Rest nichts.
  const canNext = step !== 0 || Boolean(draft.success.trim() && draft.area)

  return (
    <div>
      <div className="wizard__head">
        <div className="wizard__step-label">
          {step < EXTRAS_STEP ? `Schritt ${step + 1} von 6` : 'Optional'}
        </div>
        <div className="dots" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <div
              key={i}
              className={
                i === step ? 'dot dot--active' : i < step ? 'dot dot--past' : 'dot'
              }
            />
          ))}
        </div>
      </div>

      {step === 0 && <StepSuccess draft={draft} update={update} />}
      {step === 1 && <StepLevels draft={draft} update={update} />}
      {step === 2 && <StepWhy draft={draft} update={update} goals={goals} />}
      {step === 3 && <StepExpand draft={draft} update={update} />}
      {step === 4 && <StepNextSteps draft={draft} update={update} />}
      {step === 5 && <StepHiebe draft={draft} update={update} />}
      {isExtras && <StepExtras draft={draft} update={update} />}

      <div className="wizard__nav">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => (step === 0 ? onLeave() : onStep(step - 1))}
        >
          Zurück
        </button>
        {isExtras ? (
          <button type="button" className="btn-primary" onClick={onFinish}>
            Reflexion abschließen
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={!canNext}
            onClick={() => canNext && onStep(step + 1)}
          >
            Weiter
          </button>
        )}
      </div>
    </div>
  )
}
