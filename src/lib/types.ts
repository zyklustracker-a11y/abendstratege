export type AreaKey = 'sport' | 'business' | 'mindset' | 'religion' | 'familie'

export type Goals = Record<AreaKey, string>

/** Eine der fünf Handlungen für den nächsten Tag. */
export interface Hieb {
  text: string
  /** 'Morgens' | 'Mittags' | 'Abends' – leer, wenn nicht gesetzt. */
  slot: string
  /** 'HH:MM' – leer, wenn nicht gesetzt. */
  time: string
  done: boolean
}

/** Zusätzlicher Erfolg in Kurzform, ohne Fünf-Ebenen-Vertiefung. */
export interface Extra {
  text: string
  area: AreaKey | ''
}

export interface Entry {
  /** ISO-Datum (YYYY-MM-DD), zugleich fachlicher Schlüssel: eine Reflexion pro Tag. */
  date: string
  area: AreaKey | ''
  success: string
  levels: string[]
  why: string
  expand: string
  nextSteps: string[]
  hiebe: Hieb[]
  extras: Extra[]
}

/** Reflexion in Arbeit – wird bei jeder Eingabe zwischengespeichert. */
export interface Draft extends Entry {
  /** Tag, an dem der Entwurf begonnen wurde; verfällt am nächsten Tag. */
  _date: string
}

/** Der in localStorage abgelegte Zustand. */
export interface PersistedState {
  goals: Goals
  setupDone: boolean
  entries: Entry[]
  formula: string[]
  /** Kalenderwoche, für die der Wochenimpuls ausgeblendet wurde. */
  impulseWeek: string
  draft: Draft | null
}

export type View = 'reflect' | 'morgen' | 'rueck' | 'ziele'
export type Stage = 'intro' | 'steps' | 'done'
export type Filter = AreaKey | 'alle'
