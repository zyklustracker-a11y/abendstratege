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

/** Montag der Woche, in der `date` liegt – die Woche beginnt nach ISO 8601 montags. */
export function startOfWeek(date: Date = new Date()): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // getDay() zählt ab Sonntag; der Sonntag gehört hier zur ablaufenden Woche.
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return day
}

export function endOfWeek(date: Date = new Date()): Date {
  const day = startOfWeek(date)
  day.setDate(day.getDate() + 6)
  return day
}

/**
 * Kalenderwoche nach ISO 8601. Maßgeblich ist der Donnerstag: Die Woche gehört
 * zu dem Jahr, in dem er liegt. Deshalb zählt der 1. Januar unter Umständen
 * noch zur letzten Woche des Vorjahres – und der 31. Dezember schon zur ersten
 * des Folgejahres.
 */
export function isoWeek(date: Date = new Date()): { year: number; week: number } {
  const thursday = startOfWeek(date)
  thursday.setDate(thursday.getDate() + 3)
  const year = thursday.getFullYear()

  // Der 4. Januar liegt immer in der ersten Kalenderwoche.
  const firstThursday = startOfWeek(new Date(year, 0, 4))
  firstThursday.setDate(firstThursday.getDate() + 3)

  // Gerundet, weil eine Zeitumstellung im Zeitraum eine Stunde verschluckt.
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000)) + 1
  return { year, week }
}

/** Stabiler Schlüssel einer Kalenderwoche, z. B. „2026-W31“. */
export function weekKeyOf(date: Date = new Date()): string {
  const { year, week } = isoWeek(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** Derselbe Schlüssel für ein gespeichertes Datum (YYYY-MM-DD). */
export function weekKeyOfIso(isoDate: string): string {
  return weekKeyOf(parse(isoDate))
}

/** Montag der Woche zu einem Schlüssel – die Umkehrung von `weekKeyOf()`. */
export function weekStartOf(key: string): Date {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(key)
  if (!match) return startOfWeek()
  const monday = startOfWeek(new Date(Number(match[1]), 0, 4))
  monday.setDate(monday.getDate() + (Number(match[2]) - 1) * 7)
  return monday
}

/** Nachbarwoche eines Schlüssels; Monats- und Jahreswechsel ergeben sich von selbst. */
export function shiftWeek(key: string, delta: number): string {
  const monday = weekStartOf(key)
  monday.setDate(monday.getDate() + delta * 7)
  return weekKeyOf(monday)
}

/** „27.7. – 2.8.2026“ – das Jahr steht nur am Ende, es gilt für beide Ränder. */
export function formatWeekRange(key: string): string {
  const start = weekStartOf(key)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const short = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`
  return `${short(start)} – ${short(end)}${end.getFullYear()}`
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

/**
 * Die längste Serie aufeinanderfolgender Tage in einer Menge von Daten – anders
 * als `streakOf()` ohne Bezug auf heute, für den Rückblick auf einen Jahrgang.
 */
export function longestStreakOf(dates: string[]): number {
  const sorted = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  let previous: string | null = null

  for (const date of sorted) {
    if (previous) {
      const next = parse(previous)
      next.setDate(next.getDate() + 1)
      // Über die Kalenderrechnung statt über Millisekunden: Sonst zählt der Tag
      // der Zeitumstellung als Lücke.
      run = iso(next) === date ? run + 1 : 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    previous = date
  }
  return best
}
