import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ConfirmDialog, type ConfirmRequest } from './components/ConfirmDialog'
import { MorgenView } from './components/MorgenView'
import { ReflectView } from './components/reflect/ReflectView'
import { RueckblickView } from './components/RueckblickView'
import { SetupScreen } from './components/SetupScreen'
import { ZieleView } from './components/ZieleView'
import { useStore } from './lib/store'
import type { Filter, Stage, View } from './lib/types'

export default function App() {
  const store = useStore()
  const { data } = store

  // Ansichtszustand: bewusst nicht persistiert – jeder Abend beginnt beim Auftakt.
  const [view, setView] = useState<View>('reflect')
  const [stage, setStage] = useState<Stage>('intro')
  const [runId, setRunId] = useState<string | null>(null)
  const [runStep, setRunStep] = useState(0)
  const [doneDate, setDoneDate] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('alle')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  if (!data.setupDone) {
    return (
      <div className="app">
        <SetupScreen areas={data.areas} onFinish={store.finishSetup} />
      </div>
    )
  }

  const openRun = (reflectionId: string | null, step = 0) => {
    setRunId(reflectionId)
    setRunStep(step)
  }

  /** Einen älteren Abend im geführten Ablauf öffnen. */
  const editEntry = (date: string) => {
    store.beginDraft(date)
    const entry = data.entries.find((e) => e.date === date)
    openRun(null)
    setStage(entry && entry.reflections.length ? 'more' : 'pick')
    setView('reflect')
  }

  return (
    <div className="app">
      <div className="shell">
        <AppHeader view={view} streak={store.streak} onNavigate={setView} />

        {view === 'reflect' && (
          <ReflectView
            areas={data.areas}
            entries={data.entries}
            draft={data.draft}
            streak={store.streak}
            todayEntry={store.todayEntry}
            stage={stage}
            runId={runId}
            runStep={runStep}
            doneDate={doneDate}
            onStage={setStage}
            onFinished={(date) => {
              setDoneDate(date)
              setStage('done')
            }}
            onRun={openRun}
            onRunStep={setRunStep}
            beginDraft={store.beginDraft}
            updateDraft={store.updateDraft}
            commitDraft={store.commitDraft}
            discardDraft={store.discardDraft}
            onGoMorgen={() => {
              setView('morgen')
              setStage('intro')
            }}
            onGoZiele={() => setView('ziele')}
            onConfirm={setConfirmRequest}
          />
        )}

        {view === 'morgen' && (
          <MorgenView
            entries={data.entries}
            onToggle={store.toggleHieb}
            onUpdate={store.updateHieb}
            onRemove={store.removeHieb}
            onAdd={store.addTodo}
            onGoReflect={() => setView('reflect')}
            onConfirm={setConfirmRequest}
          />
        )}

        {view === 'rueck' && (
          <RueckblickView
            entries={data.entries}
            areas={data.areas}
            filter={filter}
            expandedId={expandedId}
            onFilter={setFilter}
            onExpand={setExpandedId}
            onEditEntry={editEntry}
            onDeleteEntry={store.deleteEntry}
            onInsight={store.setInsight}
            onGoReflect={() => setView('reflect')}
            onConfirm={setConfirmRequest}
          />
        )}

        {view === 'ziele' && (
          <ZieleView
            areas={data.areas}
            onRename={store.renameArea}
            onGoal={store.setAreaGoal}
            onAdd={store.addArea}
            onRemove={store.removeArea}
            onConfirm={setConfirmRequest}
          />
        )}
      </div>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  )
}
