import { EMPTY_GOALS } from './constants'
import type { PersistedState } from './types'

const KEY = 'abendstratege-v1'

export function emptyState(): PersistedState {
  return {
    goals: { ...EMPTY_GOALS },
    setupDone: false,
    entries: [],
    formula: [],
    impulseWeek: '',
    draft: null,
  }
}

export function loadState(): PersistedState {
  const state = emptyState()
  let data: Partial<PersistedState> | null = null
  try {
    data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    data = null
  }
  if (!data || typeof data !== 'object') return state

  if (data.goals) state.goals = { ...state.goals, ...data.goals }
  if (typeof data.setupDone === 'boolean') state.setupDone = data.setupDone
  if (Array.isArray(data.entries)) state.entries = data.entries
  if (Array.isArray(data.formula)) state.formula = data.formula
  if (typeof data.impulseWeek === 'string') state.impulseWeek = data.impulseWeek
  if (data.draft) state.draft = data.draft
  return state
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Privater Modus oder voller Speicher – die laufende Sitzung bleibt nutzbar.
  }
}
