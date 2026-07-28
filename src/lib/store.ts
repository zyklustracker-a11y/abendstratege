import { useCallback, useEffect, useMemo, useState } from 'react'
import { iso, streakOf } from './date'
import { loadState, saveState } from './storage'
import type { Draft, Entry, Goals, PersistedState } from './types'

export function emptyDraft(): Draft {
  return {
    _date: iso(),
    date: iso(),
    area: '',
    success: '',
    levels: ['', '', '', '', ''],
    why: '',
    expand: '',
    nextSteps: [''],
    hiebe: Array.from({ length: 5 }, () => ({ text: '', slot: '', time: '', done: false })),
    extras: [],
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export interface Store {
  data: PersistedState
  streak: number
  /** Die Reflexion des heutigen Tages, falls sie schon existiert. */
  todayEntry: Entry | undefined
  finishSetup: (goals: Goals) => void
  saveGoals: (goals: Goals) => void
  /** Öffnet den heutigen Eintrag zum Bearbeiten oder legt einen neuen Entwurf an. */
  beginDraft: () => void
  updateDraft: (mutate: (draft: Draft) => void) => void
  /** Schreibt den Entwurf als Eintrag des heutigen Tages fest. */
  commitDraft: () => void
  /** Hakt einen der Hiebe der jüngsten Reflexion ab. */
  toggleHieb: (index: number) => void
  addFormula: (text: string) => void
  removeFormula: (index: number) => void
  dismissImpulse: (week: string) => void
}

export function useStore(): Store {
  const [data, setData] = useState<PersistedState>(loadState)

  useEffect(() => {
    saveState(data)
  }, [data])

  const today = iso()

  const finishSetup = useCallback((goals: Goals) => {
    setData((s) => ({ ...s, goals: { ...goals }, setupDone: true }))
  }, [])

  const saveGoals = useCallback((goals: Goals) => {
    setData((s) => ({ ...s, goals: { ...goals } }))
  }, [])

  const beginDraft = useCallback(() => {
    setData((s) => {
      const date = iso()
      const existing = s.entries.find((e) => e.date === date)
      let draft: Draft
      if (existing) {
        draft = { ...clone(existing), _date: date }
        if (!draft.nextSteps?.length) draft.nextSteps = ['']
      } else if (s.draft && s.draft._date === date) {
        draft = s.draft
      } else {
        draft = emptyDraft()
      }
      return { ...s, draft }
    })
  }, [])

  const updateDraft = useCallback((mutate: (draft: Draft) => void) => {
    setData((s) => {
      const draft = clone(s.draft ?? emptyDraft())
      mutate(draft)
      return { ...s, draft }
    })
  }, [])

  const commitDraft = useCallback(() => {
    setData((s) => {
      const d = s.draft
      if (!d || !d.success.trim()) return s
      const entry: Entry = {
        date: iso(),
        area: d.area,
        success: d.success.trim(),
        levels: d.levels,
        why: d.why,
        expand: d.expand,
        nextSteps: d.nextSteps.filter((step) => step.trim()),
        hiebe: d.hiebe,
        extras: d.extras.filter((x) => x.text.trim()),
      }
      const entries = s.entries.filter((e) => e.date !== entry.date).concat([entry])
      return { ...s, entries, draft: null }
    })
  }, [])

  const toggleHieb = useCallback((index: number) => {
    setData((s) => {
      if (!s.entries.length) return s
      const entries = clone(s.entries)
      entries.sort((a, b) => (a.date < b.date ? -1 : 1))
      const last = entries[entries.length - 1]
      const hieb = last.hiebe[index]
      if (!hieb) return s
      hieb.done = !hieb.done
      return { ...s, entries }
    })
  }, [])

  const addFormula = useCallback((text: string) => {
    const value = text.trim()
    if (!value) return
    setData((s) => ({ ...s, formula: [...s.formula, value] }))
  }, [])

  const removeFormula = useCallback((index: number) => {
    setData((s) => ({ ...s, formula: s.formula.filter((_, i) => i !== index) }))
  }, [])

  const dismissImpulse = useCallback((week: string) => {
    setData((s) => ({ ...s, impulseWeek: week }))
  }, [])

  const streak = useMemo(() => streakOf(data.entries.map((e) => e.date)), [data.entries])
  const todayEntry = useMemo(
    () => data.entries.find((e) => e.date === today),
    [data.entries, today],
  )

  return {
    data,
    streak,
    todayEntry,
    finishSetup,
    saveGoals,
    beginDraft,
    updateDraft,
    commitDraft,
    addFormula,
    removeFormula,
    dismissImpulse,
    toggleHieb,
  }
}
