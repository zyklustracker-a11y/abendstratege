/** Ein Lebensbereich mit seinem übergeordneten Leitziel. Beides gehört zusammen. */
export interface Area {
  id: string
  name: string
  goal: string
  /**
   * Gelöschte Bereiche werden archiviert statt entfernt, damit alte Einträge,
   * die auf sie zeigen, vollständig lesbar bleiben.
   */
  archived?: boolean
}

/** Ein Bereichs-Durchlauf: ein Erfolg, in fünf Ebenen vertieft. */
export interface AreaReflection {
  id: string
  areaId: string
  success: string
  levels: string[]
  why: string
  expand: string
  nextSteps: string[]
}

/** Woher ein Eintrag der Tagesliste stammt. */
export type HiebSource = 'reflection' | 'extra'

/** Eine Handlung für den nächsten Tag. */
export interface Hieb {
  id: string
  text: string
  /** 'Morgens' | 'Mittags' | 'Abends' – leer, wenn nicht gesetzt. */
  slot: string
  /** 'HH:MM' – leer, wenn nicht gesetzt. */
  time: string
  done: boolean
  /** 'reflection' aus der Abendreflexion, 'extra' im Morgen-Blick ergänzt. */
  source: HiebSource
}

/** Ein Abend: beliebig viele Bereichs-Reflexionen, eine gemeinsame Hieb-Liste. */
export interface Entry {
  /** ISO-Datum (YYYY-MM-DD) und zugleich fachlicher Schlüssel: ein Eintrag pro Tag. */
  date: string
  reflections: AreaReflection[]
  hiebe: Hieb[]
  /** Optionale Notiz, die beim späteren Zurücklesen entsteht. */
  insight: string
}

/** Die begonnene, noch nicht abgeschlossene Reflexion. */
export type Draft = Entry

export interface PersistedState {
  version: number
  areas: Area[]
  entries: Entry[]
  draft: Draft | null
  setupDone: boolean
  /** Die Erfolgsformel wurde entfernt; alte Einträge bleiben unangetastet liegen. */
  legacyFormula: string[]
}

export type View = 'reflect' | 'morgen' | 'rueck' | 'ziele'

/**
 * Ablauf eines Abends: Auftakt → Bereich wählen → Durchlauf → „noch ein Bereich?“
 * → gemeinsame Hiebe → Abschluss.
 */
export type Stage = 'intro' | 'pick' | 'run' | 'more' | 'hiebe' | 'done'

/** 'alle' oder die id eines Lebensbereichs. */
export type Filter = string
