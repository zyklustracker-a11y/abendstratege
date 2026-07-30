import { iso, longestStreakOf, weekKeyOfIso, weekStartOf } from './date'
import type { Area, Entry, Hieb } from './types'

/** Einträge, neueste zuerst. */
export function sortedDesc(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** „07:30 Uhr · Morgens“ – leer, wenn weder Zeit noch Tagesabschnitt gesetzt ist. */
export function hiebMeta(hieb: Hieb): string {
  const parts: string[] = []
  if (hieb.time) parts.push(`${hieb.time} Uhr`)
  if (hieb.slot) parts.push(hieb.slot)
  return parts.join(' · ')
}

/** Nur die Hiebe aus der Abendreflexion – ohne die im Morgen-Blick ergänzten To-dos. */
export function reflectionHiebe(entry: Entry | undefined): Hieb[] {
  return (entry?.hiebe ?? []).filter((h) => h.source === 'reflection')
}

export function findArea(areas: Area[], areaId: string): Area | undefined {
  return areas.find((a) => a.id === areaId)
}

/** Anzeigename eines Bereichs – archivierte und verwaiste Zuordnungen eingeschlossen. */
export function areaLabel(areas: Area[], areaId: string): string {
  if (!areaId) return 'Ohne Bereich'
  const area = findArea(areas, areaId)
  if (!area) return 'Archivierter Bereich'
  const name = area.name.trim() || 'Ohne Namen'
  return area.archived ? `Archiviert: ${name}` : name
}

export function activeAreas(areas: Area[]): Area[] {
  return areas.filter((a) => !a.archived)
}

/** Bereiche, die in mindestens einem Eintrag vorkommen. */
export function usedAreaIds(entries: Entry[]): Set<string> {
  const ids = new Set<string>()
  for (const entry of entries) {
    for (const reflection of entry.reflections) ids.add(reflection.areaId)
  }
  return ids
}

export interface StatRow {
  areaId: string
  label: string
  count: number
}

export interface Stats {
  rows: StatRow[]
  maxCount: number
  /** Zählt nur Hiebe aus der Reflexion – zusätzliche To-dos bleiben außen vor. */
  hiebeTotal: number
  hiebeDone: number
  reflectionCount: number
}

export function statsOf(entries: Entry[], areas: Area[]): Stats {
  const counts = new Map<string, number>()
  let hiebeTotal = 0
  let hiebeDone = 0
  let reflectionCount = 0

  for (const entry of entries) {
    for (const reflection of entry.reflections) {
      counts.set(reflection.areaId, (counts.get(reflection.areaId) ?? 0) + 1)
      reflectionCount++
    }
    for (const hieb of reflectionHiebe(entry)) {
      hiebeTotal++
      if (hieb.done) hiebeDone++
    }
  }

  // Aktive Bereiche immer zeigen, archivierte nur, solange sie noch Daten tragen.
  const rows: StatRow[] = activeAreas(areas).map((area) => ({
    areaId: area.id,
    label: areaLabel(areas, area.id),
    count: counts.get(area.id) ?? 0,
  }))
  for (const [areaId, count] of counts) {
    if (rows.some((row) => row.areaId === areaId)) continue
    rows.push({ areaId, label: areaLabel(areas, areaId), count })
  }

  return {
    rows,
    maxCount: Math.max(1, ...rows.map((r) => r.count)),
    hiebeTotal,
    hiebeDone,
    reflectionCount,
  }
}

/** Umsetzungsquote in Prozent – null, solange es keinen Hieb zu messen gibt. */
export function quoteOf(stats: Stats): number | null {
  if (!stats.hiebeTotal) return null
  return Math.round((stats.hiebeDone / stats.hiebeTotal) * 100)
}

/** Das früheste vorhandene Datum – die Grenze, bis zu der geblättert werden darf. */
export function earliestDate(entries: Entry[]): string | null {
  let earliest: string | null = null
  for (const entry of entries) {
    if (!earliest || entry.date < earliest) earliest = entry.date
  }
  return earliest
}

export function entriesInWeek(entries: Entry[], weekKey: string): Entry[] {
  return entries.filter((e) => weekKeyOfIso(e.date) === weekKey)
}

export function entriesInYear(entries: Entry[], year: number): Entry[] {
  return entries.filter((e) => Number(e.date.slice(0, 4)) === year)
}

export interface WeekSummary {
  entries: Entry[]
  /** An wie vielen der sieben Abende eine Reflexion steht. */
  days: number
  stats: Stats
  /** Bereich mit den meisten Erfolgen – null, wenn die Woche leer ist. */
  strongest: StatRow | null
  /** Aktive Bereiche, in denen diese Woche nichts kam. */
  silent: StatRow[]
}

/** Die eine Woche im Rückblick – ausschließlich aus vorhandenen Daten gerechnet. */
export function weekSummary(entries: Entry[], areas: Area[], weekKey: string): WeekSummary {
  const week = entriesInWeek(entries, weekKey)
  const stats = statsOf(week, areas)
  const scored = stats.rows.filter((row) => row.count > 0)

  return {
    entries: week,
    days: new Set(week.map((e) => e.date)).size,
    stats,
    strongest: scored.length
      ? scored.reduce((best, row) => (row.count > best.count ? row : best))
      : null,
    // Nur aktive Bereiche: Ein archivierter Bereich „fehlt“ nicht, er ist weg.
    silent: activeAreas(areas)
      .map((area) => stats.rows.find((row) => row.areaId === area.id))
      .filter((row): row is StatRow => row !== undefined && row.count === 0),
  }
}

export interface MonthBar {
  /** 1–12 */
  month: number
  label: string
  count: number
}

export interface YearSummary {
  entries: Entry[]
  stats: Stats
  /** Längste Serie aufeinanderfolgender Abende innerhalb dieses Jahrgangs. */
  longestStreak: number
  months: MonthBar[]
  maxMonth: number
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

/** Ein Jahrgang im Rückblick. */
export function yearSummary(entries: Entry[], areas: Area[], year: number): YearSummary {
  const inYear = entriesInYear(entries, year)
  const counts = new Array<number>(12).fill(0)
  for (const entry of inYear) counts[Number(entry.date.slice(5, 7)) - 1]++

  return {
    entries: inYear,
    stats: statsOf(inYear, areas),
    longestStreak: longestStreakOf(inYear.map((e) => e.date)),
    months: counts.map((count, i) => ({ month: i + 1, label: MONTH_LABELS[i], count })),
    maxMonth: Math.max(1, ...counts),
  }
}

/**
 * Die Wochenhighlights eines Jahrgangs, jüngste zuerst. Maßgeblich ist das Jahr
 * im Schlüssel selbst: Es ist das ISO-Jahr der Woche und kann bei einer Woche
 * über den Jahreswechsel von ihren Kalendertagen abweichen.
 */
export function highlightsOfYear(
  highlights: Record<string, string>,
  year: number,
): { key: string; text: string }[] {
  return Object.entries(highlights)
    .filter(([key]) => key.startsWith(`${year}-W`))
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, text]) => ({ key, text }))
}

/** Jahre, in die geblättert werden darf: vom ersten Eintrag bis zum laufenden Jahr. */
export function yearRange(entries: Entry[]): { first: number; last: number } {
  const last = Number(iso().slice(0, 4))
  const earliest = earliestDate(entries)
  return { first: earliest ? Number(earliest.slice(0, 4)) : last, last }
}

/** Bis zu welcher Woche zurück geblättert werden darf. */
export function firstWeekKey(entries: Entry[]): string | null {
  const earliest = earliestDate(entries)
  return earliest ? weekKeyOfIso(earliest) : null
}

/** Liegt `weekKey` vor `other`? Vergleicht die Montage, nicht die Zeichenketten. */
export function weekBefore(weekKey: string, other: string): boolean {
  return weekStartOf(weekKey).getTime() < weekStartOf(other).getTime()
}
