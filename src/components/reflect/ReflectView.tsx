import { emptyReflection } from '../../lib/factories'
import { formatLong, formatShort, iso } from '../../lib/date'
import { areaLabel, findArea, reflectionHiebe, sortedDesc } from '../../lib/selectors'
import type { Area, AreaReflection, Draft, Entry, Stage } from '../../lib/types'
import type { ConfirmRequest } from '../ConfirmDialog'
import { DoneStage } from './DoneStage'
import { HiebeStage } from './HiebeStage'
import { IntroStage } from './IntroStage'
import { MoreStage } from './MoreStage'
import { PickAreaStage } from './PickAreaStage'
import { RunStage } from './RunStage'

interface Props {
  areas: Area[]
  entries: Entry[]
  draft: Draft | null
  streak: number
  todayEntry: Entry | undefined
  stage: Stage
  runId: string | null
  runStep: number
  onStage: (stage: Stage) => void
  /** Abschluss: merkt sich, welcher Abend gerade festgehalten wurde. */
  onFinished: (date: string) => void
  doneDate: string | null
  onRun: (reflectionId: string | null, step?: number) => void
  onRunStep: (step: number) => void
  beginDraft: (date: string) => void
  updateDraft: (mutate: (draft: Draft) => void) => void
  commitDraft: () => void
  discardDraft: () => void
  onGoMorgen: () => void
  onGoZiele: () => void
  onConfirm: (request: ConfirmRequest) => void
}

/** Schließt den Kreis: wie viele Hiebe der letzten Reflexion umgesetzt wurden. */
function recapOf(entries: Entry[], today: string): string | null {
  const previous = sortedDesc(entries).find((e) => e.date < today)
  const hiebe = reflectionHiebe(previous)
  if (!previous || !hiebe.length) return null
  const done = hiebe.filter((h) => h.done).length
  const wort = hiebe.length === 1 ? 'deinem Hieb' : `deinen ${hiebe.length} Hieben`
  return `Von ${wort} vom ${formatShort(previous.date)} hast du ${done} umgesetzt.`
}

export function ReflectView(props: Props) {
  const {
    areas,
    entries,
    draft,
    streak,
    todayEntry,
    stage,
    runId,
    runStep,
    onStage,
    onFinished,
    doneDate,
    onRun,
    onRunStep,
    beginDraft,
    updateDraft,
    commitDraft,
    discardDraft,
    onGoMorgen,
    onGoZiele,
    onConfirm,
  } = props

  const today = iso()
  const reflections = draft?.reflections ?? []

  const open = (date: string) => {
    const source = entries.find((e) => e.date === date) ?? (draft?.date === date ? draft : null)
    beginDraft(date)
    onRun(null)
    onStage(source && source.reflections.length ? 'more' : 'pick')
  }

  const updateReflection = (id: string, mutate: (reflection: AreaReflection) => void) =>
    updateDraft((d) => {
      const reflection = d.reflections.find((r) => r.id === id)
      if (reflection) mutate(reflection)
    })

  const pickArea = (areaId: string) => {
    const reflection = emptyReflection(areaId)
    updateDraft((d) => {
      d.reflections.push(reflection)
    })
    onRun(reflection.id, 0)
    onStage('run')
  }

  /** Ein Durchlauf ohne Erfolg ist keiner – beim Verlassen verwerfen wir ihn wieder. */
  const leaveRun = (reflection: AreaReflection) => {
    const empty = !reflection.success.trim()
    if (empty) {
      updateDraft((d) => {
        d.reflections = d.reflections.filter((r) => r.id !== reflection.id)
      })
    }
    const remaining = reflections.filter((r) => r.id !== reflection.id || !empty)
    onRun(null)
    onStage(remaining.length ? 'more' : 'pick')
  }

  const finish = () => {
    const date = draft?.date ?? today
    commitDraft()
    onRun(null)
    onFinished(date)
  }

  const banner =
    draft && draft.date !== today ? (
      <div className="edit-banner">
        <span>
          Du bearbeitest den Abend vom <strong>{formatShort(draft.date)}</strong>.
        </span>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            discardDraft()
            onRun(null)
            onStage('intro')
          }}
        >
          Bearbeitung abbrechen
        </button>
      </div>
    ) : null

  if (stage === 'done') {
    const date = doneDate ?? today
    const entry = entries.find((e) => e.date === date)
    return (
      <DoneStage
        streak={streak}
        hiebe={reflectionHiebe(entry)}
        onMorgen={onGoMorgen}
        onEdit={() => open(date)}
      />
    )
  }

  if (draft && stage !== 'intro') {
    const active = reflections.find((r) => r.id === runId)

    if (stage === 'run' && active) {
      return (
        <>
          {banner}
          <RunStage
            reflection={active}
            area={findArea(areas, active.areaId)}
            step={runStep}
            update={(mutate) => updateReflection(active.id, mutate)}
            onStep={onRunStep}
            onLeave={() => leaveRun(active)}
            onDone={() => {
              onRun(null)
              onStage('more')
            }}
          />
        </>
      )
    }

    if (stage === 'hiebe') {
      return (
        <>
          {banner}
          <HiebeStage
            draft={draft}
            areas={areas}
            update={updateDraft}
            onBack={() => onStage('more')}
            onFinish={finish}
          />
        </>
      )
    }

    if (stage === 'more' && reflections.length) {
      return (
        <>
          {banner}
          <MoreStage
            areas={areas}
            reflections={reflections}
            onEdit={(id) => {
              onRun(id, 0)
              onStage('run')
            }}
            onDelete={(reflection) =>
              onConfirm({
                title: 'Durchlauf entfernen?',
                text: `Der Erfolg in „${areaLabel(areas, reflection.areaId)}“ und seine Vertiefung werden aus diesem Abend entfernt.`,
                confirmLabel: 'Entfernen',
                onConfirm: () =>
                  updateDraft((d) => {
                    d.reflections = d.reflections.filter((r) => r.id !== reflection.id)
                  }),
              })
            }
            onAnother={() => onStage('pick')}
            onToHiebe={() => onStage('hiebe')}
          />
        </>
      )
    }

    return (
      <>
        {banner}
        <PickAreaStage
          areas={areas}
          reflections={reflections}
          first={reflections.length === 0}
          onPick={pickArea}
          onOpen={(id) => {
            onRun(id, 0)
            onStage('run')
          }}
          onToHiebe={() => onStage('hiebe')}
          onBack={() => {
            if (reflections.length) {
              onStage('more')
              return
            }
            if (draft.date === today && !draft.reflections.length) discardDraft()
            onStage('intro')
          }}
          onGoZiele={onGoZiele}
        />
      </>
    )
  }

  const resumable = draft?.date === today && draft.reflections.length > 0

  return (
    <IntroStage
      dateLabel={formatLong(today)}
      recapText={recapOf(entries, today)}
      startLabel={
        todayEntry
          ? 'Heutige Reflexion öffnen'
          : resumable
            ? 'Reflexion fortsetzen'
            : 'Reflexion beginnen'
      }
      onStart={() => open(today)}
    />
  )
}
