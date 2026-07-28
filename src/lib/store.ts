import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { iso, streakOf } from './date'
import { emptyDraft, emptyHieb } from './factories'
import { newId } from './id'
import { createRemote, loadRemote, persistRemote, saveProfile } from './remote'
import {
  emptyState,
  hasLocalState,
  loadCache,
  loadLocalState,
  saveCache,
} from './storage'
import type { Area, Draft, Entry, Hieb, PersistedState, Reminder, SyncStatus } from './types'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Wie lange nach der letzten Eingabe gewartet wird, bevor geschrieben wird. */
const SAVE_DELAY = 800

export interface Store {
  data: PersistedState
  /** Solange false, ist der Stand des Kontos noch unterwegs. */
  ready: boolean
  status: SyncStatus
  /** true, wenn beim ersten Login ein lokaler Stand übernommen wurde. */
  migrated: boolean
  streak: number
  todayEntry: Entry | undefined
  /** Bereiche */
  addArea: () => string
  renameArea: (areaId: string, name: string) => void
  setAreaGoal: (areaId: string, goal: string) => void
  /** Löscht den Bereich – oder archiviert ihn, solange Einträge auf ihn zeigen. */
  removeArea: (areaId: string) => void
  finishSetup: (goals: Record<string, string>) => void
  /** Reflexion */
  beginDraft: (date: string) => void
  updateDraft: (mutate: (draft: Draft) => void) => void
  discardDraft: () => void
  commitDraft: () => void
  /** Einträge */
  deleteEntry: (date: string) => void
  setInsight: (date: string, insight: string) => void
  /** Tagesliste */
  addTodo: (date: string, text: string) => void
  updateHieb: (date: string, hiebId: string, patch: Partial<Hieb>) => void
  toggleHieb: (date: string, hiebId: string) => void
  removeHieb: (date: string, hiebId: string) => void
  /** Einstellungen */
  setReminder: (patch: Partial<Reminder>) => void
}

/**
 * Der Zustand eines Kontos, gespiegelt aus Firestore.
 *
 * Geschrieben wird gebündelt und verzögert: Während des Tippens sammeln sich
 * die Änderungen, erst nach einer kurzen Pause geht ein Schreibvorgang raus –
 * und auch dann nur für die Dokumente, die sich wirklich verändert haben.
 */
export function useStore(user: User): Store {
  const uid = user.uid
  const [data, setData] = useState<PersistedState>(emptyState)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<SyncStatus>('laden')
  const [migrated, setMigrated] = useState(false)

  /** Letzter bestätigt geschriebener Stand – Grundlage des Abgleichs. */
  const savedRef = useRef<PersistedState>(emptyState())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Das Nutzerobjekt wechselt bei jeder Token-Erneuerung die Identität; als Ref
  // löst das kein erneutes Laden des gesamten Kontos aus.
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    let aborted = false
    setReady(false)
    setStatus('laden')

    // Der lokale Spiegel bringt die App sofort mit Inhalt hoch.
    const cached = loadCache(uid)
    if (cached) setData(cached)

    void (async () => {
      try {
        let remote = await loadRemote(uid)

        if (!remote) {
          // Erster Login dieses Kontos: vorhandene Browser-Daten übernehmen.
          const local = hasLocalState() ? loadLocalState() : null
          const seed = local ?? emptyState()
          await createRemote(uid, seed)
          remote = seed
          if (local) setMigrated(true)
        }

        if (aborted) return
        savedRef.current = clone(remote)
        setData(remote)
        saveCache(uid, remote)
        setReady(true)
        setStatus('bereit')
        void saveProfile(userRef.current).catch(() => undefined)
      } catch {
        if (aborted) return
        // Ohne Verbindung wird mit dem lokalen Spiegel weitergearbeitet.
        if (cached) {
          savedRef.current = clone(cached)
          setReady(true)
          setStatus('offline')
        } else {
          setStatus('fehler')
        }
      }
    })()

    return () => {
      aborted = true
    }
  }, [uid])

  // Speichern: verzögert, gebündelt, und nur bei echten Änderungen.
  useEffect(() => {
    if (!ready) return
    saveCache(uid, data)
    if (JSON.stringify(data) === JSON.stringify(savedRef.current)) return

    setStatus('speichert')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const snapshot = clone(data)
      persistRemote(uid, savedRef.current, snapshot)
        .then(() => {
          savedRef.current = snapshot
          setStatus('gespeichert')
        })
        .catch(() => {
          setStatus(navigator.onLine ? 'fehler' : 'offline')
        })
    }, SAVE_DELAY)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [data, ready, uid])

  // Zurück im Netz: den letzten Stand nachreichen.
  useEffect(() => {
    const retry = () => {
      if (!ready) return
      if (JSON.stringify(data) === JSON.stringify(savedRef.current)) {
        setStatus('bereit')
        return
      }
      const snapshot = clone(data)
      persistRemote(uid, savedRef.current, snapshot)
        .then(() => {
          savedRef.current = snapshot
          setStatus('gespeichert')
        })
        .catch(() => setStatus('fehler'))
    }
    const lost = () => setStatus('offline')

    window.addEventListener('online', retry)
    window.addEventListener('offline', lost)
    return () => {
      window.removeEventListener('online', retry)
      window.removeEventListener('offline', lost)
    }
  }, [data, ready, uid])

  const patchEntry = useCallback((date: string, mutate: (entry: Entry) => void) => {
    setData((s) => {
      const index = s.entries.findIndex((e) => e.date === date)
      if (index < 0) return s
      const entries = clone(s.entries)
      mutate(entries[index])
      return { ...s, entries }
    })
  }, [])

  const addArea = useCallback(() => {
    const id = newId('area')
    setData((s) => ({ ...s, areas: [...s.areas, { id, name: '', goal: '' }] }))
    return id
  }, [])

  const renameArea = useCallback((areaId: string, name: string) => {
    setData((s) => ({
      ...s,
      areas: s.areas.map((a) => (a.id === areaId ? { ...a, name } : a)),
    }))
  }, [])

  const setAreaGoal = useCallback((areaId: string, goal: string) => {
    setData((s) => ({
      ...s,
      areas: s.areas.map((a) => (a.id === areaId ? { ...a, goal } : a)),
    }))
  }, [])

  const removeArea = useCallback((areaId: string) => {
    setData((s) => {
      const referenced =
        s.entries.some((e) => e.reflections.some((r) => r.areaId === areaId)) ||
        Boolean(s.draft?.reflections.some((r) => r.areaId === areaId))
      const areas: Area[] = referenced
        ? s.areas.map((a) => (a.id === areaId ? { ...a, archived: true } : a))
        : s.areas.filter((a) => a.id !== areaId)
      return { ...s, areas }
    })
  }, [])

  const finishSetup = useCallback((goals: Record<string, string>) => {
    setData((s) => ({
      ...s,
      setupDone: true,
      areas: s.areas.map((a) => ({ ...a, goal: goals[a.id] ?? a.goal })),
    }))
  }, [])

  const beginDraft = useCallback((date: string) => {
    setData((s) => {
      const existing = s.entries.find((e) => e.date === date)
      let draft: Draft
      if (existing) {
        draft = clone(existing)
        // Im Morgen-Blick ergänzte To-dos gehören nicht in den Abend-Entwurf.
        draft.hiebe = draft.hiebe.filter((h) => h.source === 'reflection')
        if (!draft.hiebe.length) draft.hiebe = [emptyHieb()]
      } else if (s.draft && s.draft.date === date) {
        draft = s.draft
      } else {
        draft = emptyDraft(date)
      }
      return { ...s, draft }
    })
  }, [])

  const updateDraft = useCallback((mutate: (draft: Draft) => void) => {
    setData((s) => {
      if (!s.draft) return s
      const draft = clone(s.draft)
      mutate(draft)
      return { ...s, draft }
    })
  }, [])

  const discardDraft = useCallback(() => {
    setData((s) => ({ ...s, draft: null }))
  }, [])

  const commitDraft = useCallback(() => {
    setData((s) => {
      const draft = s.draft
      if (!draft) return s
      const reflections = draft.reflections
        .filter((r) => r.success.trim())
        .map((r) => ({ ...r, nextSteps: r.nextSteps.filter((step) => step.trim()) }))
      const hiebe = draft.hiebe.filter((h) => h.text.trim())
      if (!reflections.length || !hiebe.length) return s

      const entry: Entry = { date: draft.date, reflections, hiebe, insight: draft.insight }
      // Beim Bearbeiten eines bestehenden Abends bleiben nachträgliche To-dos erhalten.
      const previous = s.entries.find((e) => e.date === draft.date)
      const keptExtras = (previous?.hiebe ?? []).filter(
        (h) => h.source === 'extra' && !hiebe.some((n) => n.id === h.id),
      )
      entry.hiebe = [...hiebe, ...keptExtras]

      return {
        ...s,
        entries: s.entries.filter((e) => e.date !== entry.date).concat([entry]),
        draft: null,
      }
    })
  }, [])

  const deleteEntry = useCallback((date: string) => {
    setData((s) => ({ ...s, entries: s.entries.filter((e) => e.date !== date) }))
  }, [])

  const setInsight = useCallback(
    (date: string, insight: string) => patchEntry(date, (entry) => void (entry.insight = insight)),
    [patchEntry],
  )

  const addTodo = useCallback(
    (date: string, text: string) => {
      const value = text.trim()
      if (!value) return
      patchEntry(date, (entry) => void entry.hiebe.push({ ...emptyHieb('extra'), text: value }))
    },
    [patchEntry],
  )

  const updateHieb = useCallback(
    (date: string, hiebId: string, patch: Partial<Hieb>) =>
      patchEntry(date, (entry) => {
        const hieb = entry.hiebe.find((h) => h.id === hiebId)
        if (hieb) Object.assign(hieb, patch)
      }),
    [patchEntry],
  )

  const toggleHieb = useCallback(
    (date: string, hiebId: string) =>
      patchEntry(date, (entry) => {
        const hieb = entry.hiebe.find((h) => h.id === hiebId)
        if (hieb) hieb.done = !hieb.done
      }),
    [patchEntry],
  )

  const removeHieb = useCallback(
    (date: string, hiebId: string) =>
      patchEntry(date, (entry) => {
        entry.hiebe = entry.hiebe.filter((h) => h.id !== hiebId)
      }),
    [patchEntry],
  )

  const setReminder = useCallback((patch: Partial<Reminder>) => {
    setData((s) => ({ ...s, reminder: { ...s.reminder, ...patch } }))
  }, [])

  const streak = useMemo(() => streakOf(data.entries.map((e) => e.date)), [data.entries])
  const today = iso()
  const todayEntry = useMemo(
    () => data.entries.find((e) => e.date === today),
    [data.entries, today],
  )

  return {
    data,
    ready,
    status,
    migrated,
    streak,
    todayEntry,
    addArea,
    renameArea,
    setAreaGoal,
    removeArea,
    finishSetup,
    beginDraft,
    updateDraft,
    discardDraft,
    commitDraft,
    deleteEntry,
    setInsight,
    addTodo,
    updateHieb,
    toggleHieb,
    removeHieb,
    setReminder,
  }
}
