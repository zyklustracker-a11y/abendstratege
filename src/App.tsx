import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { MorgenView } from './components/MorgenView'
import { ReflectView } from './components/reflect/ReflectView'
import { RueckblickView } from './components/RueckblickView'
import { SetupScreen } from './components/SetupScreen'
import { ZieleView } from './components/ZieleView'
import { weekKey } from './lib/date'
import { useStore } from './lib/store'
import type { AreaKey, Filter, Goals, Stage, View } from './lib/types'

export default function App() {
  const store = useStore()
  const { data } = store

  // Ansichtszustand: bewusst nicht persistiert – jeder Abend beginnt beim Auftakt.
  const [view, setView] = useState<View>('reflect')
  const [stage, setStage] = useState<Stage>('intro')
  const [step, setStep] = useState(0)
  const [filter, setFilter] = useState<Filter>('alle')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formulaInput, setFormulaInput] = useState('')
  const [zieleDraft, setZieleDraft] = useState<Goals>(() => ({ ...data.goals }))
  const [zieleSaved, setZieleSaved] = useState(false)

  if (!data.setupDone) {
    return (
      <div className="app">
        <SetupScreen
          onFinish={(goals) => {
            store.finishSetup(goals)
            setZieleDraft({ ...goals })
          }}
        />
      </div>
    )
  }

  const navigate = (next: View) => {
    setView(next)
    setZieleSaved(false)
  }

  return (
    <div className="app">
      <div className="shell">
        <AppHeader view={view} streak={store.streak} onNavigate={navigate} />

        {view === 'reflect' && (
          <ReflectView
            goals={data.goals}
            entries={data.entries}
            draft={data.draft}
            streak={store.streak}
            todayEntry={store.todayEntry}
            stage={stage}
            step={step}
            onStage={setStage}
            onStep={setStep}
            beginDraft={store.beginDraft}
            updateDraft={store.updateDraft}
            commitDraft={store.commitDraft}
            onGoMorgen={() => {
              setView('morgen')
              setStage('intro')
            }}
          />
        )}

        {view === 'morgen' && (
          <MorgenView
            entries={data.entries}
            onToggle={store.toggleHieb}
            onGoReflect={() => navigate('reflect')}
          />
        )}

        {view === 'rueck' && (
          <RueckblickView
            entries={data.entries}
            formula={data.formula}
            impulseWeek={data.impulseWeek}
            filter={filter}
            expandedId={expandedId}
            formulaInput={formulaInput}
            onFilter={setFilter}
            onExpand={setExpandedId}
            onFormulaInput={setFormulaInput}
            onAddFormula={() => {
              if (!formulaInput.trim()) return
              store.addFormula(formulaInput)
              setFormulaInput('')
            }}
            onRemoveFormula={store.removeFormula}
            onDismissImpulse={() => store.dismissImpulse(weekKey())}
            onGoReflect={() => navigate('reflect')}
          />
        )}

        {view === 'ziele' && (
          <ZieleView
            draft={zieleDraft}
            saved={zieleSaved}
            onChange={(area: AreaKey, value: string) => {
              setZieleDraft((current) => ({ ...current, [area]: value }))
              setZieleSaved(false)
            }}
            onSave={() => {
              store.saveGoals(zieleDraft)
              setZieleSaved(true)
            }}
          />
        )}
      </div>
    </div>
  )
}
