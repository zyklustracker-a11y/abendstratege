import { RUN_STEPS } from '../../lib/constants'
import type { Area, AreaReflection } from '../../lib/types'
import { StepExpand, StepLevels, StepNextSteps, StepSuccess, StepWhy } from './steps'

interface Props {
  reflection: AreaReflection
  area: Area | undefined
  step: number
  update: (mutate: (reflection: AreaReflection) => void) => void
  onStep: (step: number) => void
  /** Zurück aus dem ersten Schritt verlässt den Durchlauf. */
  onLeave: () => void
  /** Nach dem letzten Schritt: „Noch ein Bereich?“ */
  onDone: () => void
}

/** Der geführte Durchlauf für genau einen Lebensbereich. */
export function RunStage({ reflection, area, step, update, onStep, onLeave, onDone }: Props) {
  const canNext = step !== 0 || Boolean(reflection.success.trim())
  const areaName = area?.name?.trim() || 'Ohne Bereich'

  return (
    <div>
      <div className="wizard__head">
        <div className="wizard__step-label">
          {areaName} · Schritt {step + 1} von {RUN_STEPS}
        </div>
        <div className="dots" aria-hidden="true">
          {Array.from({ length: RUN_STEPS }, (_, i) => (
            <div
              key={i}
              className={i === step ? 'dot dot--active' : i < step ? 'dot dot--past' : 'dot'}
            />
          ))}
        </div>
      </div>

      {step === 0 && <StepSuccess reflection={reflection} update={update} />}
      {step === 1 && <StepLevels reflection={reflection} update={update} />}
      {step === 2 && <StepWhy reflection={reflection} update={update} area={area} />}
      {step === 3 && <StepExpand reflection={reflection} update={update} />}
      {step === 4 && <StepNextSteps reflection={reflection} update={update} />}

      <div className="wizard__nav">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => (step === 0 ? onLeave() : onStep(step - 1))}
        >
          Zurück
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!canNext}
          onClick={() => {
            if (!canNext) return
            if (step + 1 < RUN_STEPS) onStep(step + 1)
            else onDone()
          }}
        >
          {step + 1 < RUN_STEPS ? 'Weiter' : 'Bereich abschließen'}
        </button>
      </div>
    </div>
  )
}
