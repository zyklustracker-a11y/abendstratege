import { formatLong, formatShort, iso } from '../../lib/date'
import { filledHiebe, sortedDesc } from '../../lib/selectors'
import type { Draft, Entry, Goals, Stage } from '../../lib/types'
import { DoneStage } from './DoneStage'
import { IntroStage } from './IntroStage'
import { StepsStage } from './StepsStage'

interface Props {
  goals: Goals
  entries: Entry[]
  draft: Draft | null
  streak: number
  todayEntry: Entry | undefined
  stage: Stage
  step: number
  onStage: (stage: Stage) => void
  onStep: (step: number) => void
  beginDraft: () => void
  updateDraft: (mutate: (draft: Draft) => void) => void
  commitDraft: () => void
  onGoMorgen: () => void
}

/** Schließt den Kreis: wie viele Hiebe der letzten Reflexion umgesetzt wurden. */
function recapOf(entries: Entry[], today: string): string | null {
  const previous = sortedDesc(entries).find((e) => e.date < today)
  if (!previous) return null
  const hiebe = filledHiebe(previous)
  if (!hiebe.length) return null
  const done = hiebe.filter((h) => h.done).length
  return `Von deinen ${hiebe.length} Hieben vom ${formatShort(previous.date)} hast du ${done} umgesetzt.`
}

export function ReflectView({
  goals,
  entries,
  draft,
  streak,
  todayEntry,
  stage,
  step,
  onStage,
  onStep,
  beginDraft,
  updateDraft,
  commitDraft,
  onGoMorgen,
}: Props) {
  const today = iso()

  const start = () => {
    beginDraft()
    onStage('steps')
    onStep(0)
  }

  const finish = () => {
    if (!draft || !draft.success.trim()) return
    commitDraft()
    onStage('done')
  }

  if (stage === 'steps' && draft) {
    return (
      <StepsStage
        draft={draft}
        goals={goals}
        step={step}
        update={updateDraft}
        onStep={onStep}
        onLeave={() => onStage('intro')}
        onFinish={finish}
      />
    )
  }

  if (stage === 'done') {
    return (
      <DoneStage
        streak={streak}
        hiebe={filledHiebe(todayEntry)}
        onMorgen={onGoMorgen}
        onEdit={start}
      />
    )
  }

  return (
    <IntroStage
      dateLabel={formatLong(today)}
      recapText={recapOf(entries, today)}
      startLabel={todayEntry ? 'Heutige Reflexion öffnen' : 'Reflexion beginnen'}
      onStart={start}
    />
  )
}
