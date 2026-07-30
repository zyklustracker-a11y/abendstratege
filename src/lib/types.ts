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

/** Einstellungen der abendlichen Push-Erinnerung. */
export interface Reminder {
  enabled: boolean
  /** 'HH:MM' in der Zeitzone des Nutzers. */
  time: string
  /** IANA-Zone, z. B. 'Europe/Berlin' – beim Aktivieren vom Gerät übernommen. */
  timeZone: string
  /**
   * Lokales Datum der zuletzt verschickten Erinnerung. Der Versand-Job setzt
   * den Wert, damit an einem Abend höchstens eine Benachrichtigung rausgeht.
   */
  lastSentLocalDate?: string
}

/**
 * Ein angemeldetes Gerät mit seinem Push-Abo. Pro Nutzer beliebig viele –
 * jedes Gerät meldet sich selbst an, ein neues Handy braucht keine erneute
 * Einstellung.
 */
export interface PushDevice {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  label: string
  createdAt: number
}

export interface PersistedState {
  version: number
  areas: Area[]
  entries: Entry[]
  draft: Draft | null
  setupDone: boolean
  /** Die Erfolgsformel wurde entfernt; alte Einträge bleiben unangetastet liegen. */
  legacyFormula: string[]
  reminder: Reminder
  /**
   * Ein selbst geschriebener Satz je Kalenderwoche, Schlüssel „2026-W31“.
   * Liegt im Wurzeldokument, nicht in den Abend-Dokumenten: Der Satz gehört
   * keinem einzelnen Abend, und das Wurzeldokument wird beim Schreiben des
   * Entwurfs ohnehin angefasst – die Zahl der Schreibvorgänge steigt dadurch
   * also nicht.
   */
  weeklyHighlights: Record<string, string>
}

export type View = 'reflect' | 'morgen' | 'rueck' | 'ziele' | 'einstellungen'

/** Zustand der Cloud-Synchronisation – Grundlage für die dezente Statusanzeige. */
export type SyncStatus = 'laden' | 'bereit' | 'speichert' | 'gespeichert' | 'offline' | 'fehler'

/**
 * Ablauf eines Abends: Auftakt → Bereich wählen → Durchlauf → „noch ein Bereich?“
 * → gemeinsame Hiebe → Abschluss.
 */
export type Stage = 'intro' | 'pick' | 'run' | 'more' | 'hiebe' | 'done'

/** 'alle' oder die id eines Lebensbereichs. */
export type Filter = string

/** Zeitraum des Rückblicks – reiner Ansichtszustand, nichts davon wird gespeichert. */
export type Period = 'woche' | 'jahr' | 'alles'
