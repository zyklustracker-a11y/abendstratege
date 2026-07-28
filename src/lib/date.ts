/** Lokales ISO-Datum (YYYY-MM-DD) – bewusst ohne UTC-Umrechnung, damit der Abend zum richtigen Tag gehört. */
export function iso(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

function parse(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** „Dienstag, 28. Juli 2026“ */
export function formatLong(isoDate: string): string {
  return parse(isoDate).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** „Di., 28. Juli 2026“ */
export function formatShort(isoDate: string): string {
  return parse(isoDate).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Schlüssel der laufenden Woche, z. B. „2026-31“ – für den Wochenimpuls. */
export function weekKey(date: Date = new Date()): string {
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7,
  )
  return `${date.getFullYear()}-${week}`
}

/**
 * Tage in Folge mit Reflexion. Zählt ab heute rückwärts; wurde heute noch nicht
 * reflektiert, beginnt die Zählung bei gestern – so bricht der Streak nicht,
 * bevor der Abend vorbei ist.
 */
export function streakOf(dates: string[]): number {
  const set = new Set(dates)
  const cursor = new Date()
  if (!set.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  let n = 0
  while (set.has(iso(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return n
}
