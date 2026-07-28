import { AREAS } from './constants'
import type { AreaKey, Entry, Hieb } from './types'

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

export function filledHiebe(entry: Entry | undefined): Hieb[] {
  return (entry?.hiebe ?? []).filter((h) => h.text.trim())
}

export interface Stats {
  /** Erfolge je Lebensbereich – Haupterfolg und weitere Erfolge zählen gleich. */
  counts: Record<AreaKey, number>
  maxCount: number
  hiebeTotal: number
  hiebeDone: number
}

export function statsOf(entries: Entry[]): Stats {
  const counts = Object.fromEntries(AREAS.map(([k]) => [k, 0])) as Record<AreaKey, number>
  let hiebeTotal = 0
  let hiebeDone = 0
  for (const entry of entries) {
    if (entry.area) counts[entry.area]++
    for (const extra of entry.extras ?? []) {
      if (extra.area) counts[extra.area]++
    }
    for (const hieb of entry.hiebe ?? []) {
      if (hieb.text.trim()) {
        hiebeTotal++
        if (hieb.done) hiebeDone++
      }
    }
  }
  return { counts, maxCount: Math.max(1, ...Object.values(counts)), hiebeTotal, hiebeDone }
}
