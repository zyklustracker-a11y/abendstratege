import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { AppHeader } from './components/AppHeader'
import { ConfirmDialog, type ConfirmRequest } from './components/ConfirmDialog'
import { LoginScreen } from './components/LoginScreen'
import { MorgenView } from './components/MorgenView'
import { ReflectView } from './components/reflect/ReflectView'
import { RueckblickView } from './components/RueckblickView'
import { SettingsView } from './components/SettingsView'
import { SetupScreen } from './components/SetupScreen'
import { ZieleView } from './components/ZieleView'
import { useAuth } from './lib/auth'
import { iso, weekKeyOf } from './lib/date'
import { firebaseConfigured } from './lib/firebase-config'
import { registerServiceWorker, syncPushDevice } from './lib/push'
import { useStore } from './lib/store'
import type { Filter, Period, Stage, View } from './lib/types'

/** Startansicht: Ein Tipp auf die Benachrichtigung führt direkt in die Reflexion. */
function initialView(): View {
  const requested = new URLSearchParams(window.location.search).get('view')
  const allowed: View[] = ['reflect', 'morgen', 'rueck', 'ziele', 'einstellungen']
  return allowed.includes(requested as View) ? (requested as View) : 'reflect'
}

export default function App() {
  const { user, pending, error } = useAuth()

  useEffect(() => {
    void registerServiceWorker()
  }, [])

  if (!firebaseConfigured) {
    return (
      <div className="app">
        <div className="login">
          <div className="login__inner">
            <h1 className="login__title">Fast fertig</h1>
            <p className="login__lead">
              Die Zugangsdaten des Firebase-Projekts fehlen noch. Sie gehören in
              <code> src/lib/firebase-config.ts</code> – die Anleitung dazu steht in
              <code> SETUP.md</code>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="app">
        <div className="login">
          <div className="login__inner">
            <p className="login__lead">Einen Moment …</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <LoginScreen />
        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return <SignedInApp user={user} />
}

function SignedInApp({ user }: { user: User }) {
  const store = useStore(user)
  const { data } = store

  // Ansichtszustand: bewusst nicht persistiert – jeder Abend beginnt beim Auftakt.
  const [view, setView] = useState<View>(initialView)
  const [stage, setStage] = useState<Stage>('intro')
  const [runId, setRunId] = useState<string | null>(null)
  const [runStep, setRunStep] = useState(0)
  const [doneDate, setDoneDate] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('alle')
  // Zeitraum des Rückblicks: „Alles“ ist die gewohnte Ansicht und bleibt der
  // Einstieg. Woche und Jahr starten beim laufenden Zeitraum.
  const [period, setPeriod] = useState<Period>('alles')
  const [weekKey, setWeekKey] = useState<string>(() => weekKeyOf())
  const [year, setYear] = useState<number>(() => Number(iso().slice(0, 4)))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)

  /**
   * Ein neues Gerät meldet sich selbst am Verteiler an, sobald die Erinnerung
   * im Konto aktiv ist – ohne dass die Einstellung erneut gesetzt werden muss.
   */
  useEffect(() => {
    if (store.ready && data.reminder.enabled) void syncPushDevice(user.uid)
  }, [store.ready, data.reminder.enabled, user.uid])

  if (!store.ready) {
    return (
      <div className="app">
        <div className="login">
          <div className="login__inner">
            <p className="login__lead">
              {store.status === 'fehler'
                ? 'Deine Aufzeichnungen konnten nicht geladen werden. Prüfe die Verbindung und lade die Seite neu.'
                : 'Deine Aufzeichnungen werden geladen …'}
            </p>
          </div>
        </div>
      </div>
    )
  }

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
        <AppHeader
          view={view}
          streak={store.streak}
          status={store.status}
          onNavigate={setView}
        />

        {store.migrated && (
          <div className="edit-banner" role="status">
            <span>Deine bisher in diesem Browser gespeicherten Abende wurden übernommen.</span>
          </div>
        )}

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
            period={period}
            weekKey={weekKey}
            year={year}
            weeklyHighlights={data.weeklyHighlights}
            expandedId={expandedId}
            onFilter={setFilter}
            onPeriod={setPeriod}
            onWeekKey={setWeekKey}
            onYear={setYear}
            onWeeklyHighlight={store.setWeeklyHighlight}
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

        {view === 'einstellungen' && (
          <SettingsView
            user={user}
            reminder={data.reminder}
            onReminder={store.setReminder}
            onConfirm={setConfirmRequest}
          />
        )}
      </div>

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </div>
  )
}
