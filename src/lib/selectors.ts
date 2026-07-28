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
