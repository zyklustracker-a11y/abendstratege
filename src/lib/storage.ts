import { DEFAULT_AREAS, DEFAULT_REMINDER_TIME } from './constants'
import { newId } from './id'
import type { Area, Entry, Hieb, PersistedState, Reminder } from './types'

/** Der ursprüngliche, rein lokale Speicher. Bleibt als Quelle der Erstübernahme. */
const KEY = 'abendstratege-v1'
export const CURRENT_VERSION = 2

export function defaultAreas(): Area[] {
  return DEFAULT_AREAS.map(([id, name]) => ({ id, name, goal: '' }))
}

export function defaultReminder(): Reminder {
  return { enabled: false, time: DEFAULT_REMINDER_TIME, timeZone: deviceTimeZone() }
}

/** Zeitzone des Geräts – Grundlage dafür, dass 21:00 Uhr auch 21:00 Uhr heißt. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'
  } catch {
    return 'Europe/Berlin'
  }
}

export function emptyState(): PersistedState {
  return {
    version: CURRENT_VERSION,
    areas: defaultAreas(),
    entries: [],
    draft: null,
    setupDone: false,
    legacyFormula: [],
    reminder: defaultReminder(),
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function levelsOf(value: unknown): string[] {
  const list = Array.isArray(value) ? value.map(str) : []
  return Array.from({ length: 5 }, (_, i) => list[i] ?? '')
}

function hiebeOf(value: unknown): Hieb[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((h) => h && str(h.text).trim())
    .map((h) => ({
      id: str(h.id) || newId('hieb'),
      text: str(h.text),
      slot: str(h.slot),
      time: str(h.time),
      done: Boolean(h.done),
      source: h.source === 'extra' ? 'extra' : 'reflection',
    }))
}

/**
 * Format 1 kannte genau einen Erfolg pro Abend plus „weitere Erfolge“ in Kurzform.
 * Beides wird zu Bereichs-Reflexionen des neuen Formats – der Kurzform fehlen
 * lediglich die Vertiefungen, die es dort nie gab.
 */
function migrateEntryV1(raw: Record<string, unknown>): Entry | null {
  const date = str(raw.date)
  if (!date) return null

  const reflections = []
  const success = str(raw.success).trim()
  const levels = levelsOf(raw.levels)
  if (success || levels.some((l) => l.trim())) {
    reflections.push({
      id: newId('refl'),
      areaId: str(raw.area),
      success,
      levels,
      why: str(raw.why),
      expand: str(raw.expand),
      nextSteps: Array.isArray(raw.nextSteps) ? raw.nextSteps.map(str).filter((s) => s.trim()) : [],
    })
  }
  const extras = Array.isArray(raw.extras) ? raw.extras : []
  for (const extra of extras) {
    const text = str(extra?.text).trim()
    if (!text) continue
    reflections.push({
      id: newId('refl'),
      areaId: str(extra?.area),
      success: text,
      levels: ['', '', '', '', ''],
      why: '',
      expand: '',
      nextSteps: [],
    })
  }
  if (!reflections.length) return null

  return { date, reflections, hiebe: hiebeOf(raw.hiebe), insight: str(raw.insight) }
}

function migrateV1(data: Record<string, unknown>): PersistedState {
  const goals = (data.goals ?? {}) as Record<string, unknown>
  const areas = DEFAULT_AREAS.map(([id, name]) => ({ id, name, goal: str(goals[id]) }))

  const rawEntries = Array.isArray(data.entries) ? data.entries : []
  const entries = rawEntries
    .map((e) => migrateEntryV1((e ?? {}) as Record<string, unknown>))
    .filter((e): e is Entry => e !== null)

  const rawDraft = data.draft as Record<string, unknown> | null | undefined
  const draft = rawDraft ? migrateEntryV1({ ...rawDraft, date: str(rawDraft._date) || str(rawDraft.date) }) : null

  return {
    version: CURRENT_VERSION,
    areas,
    entries,
    draft,
    setupDone: Boolean(data.setupDone),
    legacyFormula: Array.isArray(data.formula) ? data.formula.map(str) : [],
    reminder: defaultReminder(),
  }
}

function readV2(data: Record<string, unknown>): PersistedState {
  const state = emptyState()
  if (Array.isArray(data.areas) && data.areas.length) {
    state.areas = data.areas
      .filter((a) => a && str(a.id))
      .map((a) => ({
        id: str(a.id),
        name: str(a.name),
        goal: str(a.goal),
        ...(a.archived ? { archived: true } : {}),
      }))
  }
  if (Array.isArray(data.entries)) {
    state.entries = data.entries
      .filter((e) => e && str(e.date))
      .map((e) => ({
        date: str(e.date),
        reflections: Array.isArray(e.reflections)
          ? e.reflections.map((r: Record<string, unknown>) => ({
              id: str(r.id) || newId('refl'),
              areaId: str(r.areaId),
              success: str(r.success),
              levels: levelsOf(r.levels),
              why: str(r.why),
              expand: str(r.expand),
              nextSteps: Array.isArray(r.nextSteps) ? r.nextSteps.map(str) : [],
            }))
          : [],
        hiebe: hiebeOf(e.hiebe),
        insight: str(e.insight),
      }))
  }
  if (data.draft && typeof data.draft === 'object') {
    const [migrated] = readV2({ entries: [data.draft] }).entries
    state.draft = migrated ?? null
  }
  state.setupDone = Boolean(data.setupDone)
  if (Array.isArray(data.legacyFormula)) state.legacyFormula = data.legacyFormula.map(str)
  state.reminder = reminderOf(data.reminder)
  return state
}

export function reminderOf(value: unknown): Reminder {
  const raw = (value ?? {}) as Record<string, unknown>
  const time = /^\d{2}:\d{2}$/.test(str(raw.time)) ? str(raw.time) : DEFAULT_REMINDER_TIME
  return {
    enabled: Boolean(raw.enabled),
    time,
    timeZone: str(raw.timeZone) || deviceTimeZone(),
    ...(str(raw.lastSentLocalDate) ? { lastSentLocalDate: str(raw.lastSentLocalDate) } : {}),
  }
}

/** Liest einen beliebigen gespeicherten Stand – lokal wie aus der Cloud. */
export function parseState(data: unknown): PersistedState {
  if (!data || typeof data !== 'object') return emptyState()
  const record = data as Record<string, unknown>
  if (typeof record.version === 'number' && record.version >= 2) return readV2(record)
  return migrateV1(record)
}

/** Der alte, rein lokale Stand – Quelle für die einmalige Übernahme ins Konto. */
export function loadLocalState(): PersistedState | null {
  let data: unknown = null
  try {
    data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  return parseState(data)
}

export function hasLocalState(): boolean {
  const state = loadLocalState()
  return Boolean(state && (state.entries.length || state.setupDone))
}

/**
 * Spiegel des Kontostands im Browser. Damit steht die App auch ohne Verbindung
 * sofort mit Inhalt da, statt auf die Cloud zu warten.
 */
const cacheKey = (uid: string) => `abendstratege-cache-${uid}`

export function loadCache(uid: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return raw ? parseState(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveCache(uid: string, state: PersistedState): void {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(state))
  } catch {
    // Privater Modus oder voller Speicher – die laufende Sitzung bleibt nutzbar.
  }
}
