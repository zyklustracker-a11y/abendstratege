/**
 * Prüft die Wochen- und Serienrechnung aus src/lib/date.ts – reine Funktionen,
 * also ohne Browser und ohne Konto prüfbar.
 *
 *   node --experimental-strip-types scripts/test-week.mjs
 *
 * Node lädt die TypeScript-Datei direkt und wirft die Typen weg; das kostet
 * keine zusätzliche Abhängigkeit und hält die Prüfung an der echten Quelle.
 */
import {
  endOfWeek,
  formatWeekRange,
  isoWeek,
  longestStreakOf,
  shiftWeek,
  startOfWeek,
  weekKeyOf,
  weekKeyOfIso,
  weekStartOf,
} from '../src/lib/date.ts'

let bestanden = 0
let gescheitert = 0

function pruefe(name, ist, soll) {
  const gleich = JSON.stringify(ist) === JSON.stringify(soll)
  if (gleich) {
    console.log(`  ✓ ${name}`)
    bestanden++
  } else {
    console.error(`  ✗ ${name}\n    erwartet ${JSON.stringify(soll)}, war ${JSON.stringify(ist)}`)
    gescheitert++
  }
}

/** Lokales Datum, damit die Prüfung nicht an der Zeitzone des Rechners hängt. */
const tag = (y, m, d) => new Date(y, m - 1, d)
const kurz = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

console.log('Wochenanfang (Montag) und Wochenende (Sonntag):')

pruefe('Mittwoch gehört zur Woche ab Montag', kurz(startOfWeek(tag(2026, 7, 29))), '2026-7-27')
pruefe('Der Montag selbst bleibt stehen', kurz(startOfWeek(tag(2026, 7, 27))), '2026-7-27')
pruefe(
  'Der Sonntag gehört zur ablaufenden Woche, nicht zur nächsten',
  kurz(startOfWeek(tag(2026, 8, 2))),
  '2026-7-27',
)
pruefe('Wochenende ist der Sonntag', kurz(endOfWeek(tag(2026, 7, 29))), '2026-8-2')
pruefe('Über den Monatswechsel hinweg', kurz(startOfWeek(tag(2026, 3, 1))), '2026-2-23')

console.log('\nKalenderwoche nach ISO 8601:')

pruefe('28. Juli 2026 liegt in KW 31', isoWeek(tag(2026, 7, 28)), { year: 2026, week: 31 })
pruefe('Der 4. Januar liegt immer in KW 1', isoWeek(tag(2026, 1, 4)), { year: 2026, week: 1 })
pruefe('Schlüsselform mit führender Null', weekKeyOf(tag(2026, 1, 4)), '2026-W01')
pruefe('Schlüssel aus gespeichertem Datum', weekKeyOfIso('2026-07-28'), '2026-W31')

console.log('\nJahreswechsel (der 1. Januar gehört nicht immer zum neuen Jahr):')

// 2027 beginnt an einem Freitag – der 1. Januar zählt noch zur letzten Woche 2026.
pruefe('1. Januar 2027 → KW 53 des Jahres 2026', weekKeyOf(tag(2027, 1, 1)), '2026-W53')
pruefe('3. Januar 2027 ist der Sonntag derselben Woche', weekKeyOf(tag(2027, 1, 3)), '2026-W53')
pruefe('4. Januar 2027 beginnt KW 1', weekKeyOf(tag(2027, 1, 4)), '2027-W01')

// 2025 beginnt an einem Mittwoch – der 31. Dezember 2024 zählt schon zu 2025.
pruefe('31. Dezember 2024 → KW 1 des Jahres 2025', weekKeyOf(tag(2024, 12, 31)), '2025-W01')
pruefe('29. Dezember 2024 ist ein Sonntag und noch KW 52', weekKeyOf(tag(2024, 12, 29)), '2024-W52')
pruefe('2026 hat 53 Kalenderwochen', isoWeek(tag(2026, 12, 31)), { year: 2026, week: 53 })

console.log('\nSchlüssel zurück in ein Datum:')

pruefe('Montag der KW 31/2026', kurz(weekStartOf('2026-W31')), '2026-7-27')
pruefe('Montag der KW 1/2026', kurz(weekStartOf('2026-W01')), '2025-12-29')
pruefe('Montag der KW 53/2026', kurz(weekStartOf('2026-W53')), '2026-12-28')
pruefe('Hin und zurück ergibt denselben Schlüssel', weekKeyOf(weekStartOf('2026-W53')), '2026-W53')
pruefe('Unsinniger Schlüssel fällt auf die laufende Woche zurück', weekStartOf('quatsch').getDay(), 1)

console.log('\nBlättern:')

pruefe('Eine Woche vor', shiftWeek('2026-W31', -1), '2026-W30')
pruefe('Eine Woche weiter', shiftWeek('2026-W31', 1), '2026-W32')
pruefe('Über den Jahreswechsel zurück', shiftWeek('2027-W01', -1), '2026-W53')
pruefe('Über den Jahreswechsel vorwärts', shiftWeek('2026-W53', 1), '2027-W01')
pruefe('Über die Zeitumstellung Ende März', shiftWeek('2026-W13', 1), '2026-W14')
pruefe('Über die Zeitumstellung Ende Oktober', shiftWeek('2026-W43', 1), '2026-W44')

console.log('\nBeschriftung des Zeitraums:')

pruefe('Über den Monatswechsel', formatWeekRange('2026-W31'), '27.7. – 2.8.2026')
pruefe('Innerhalb eines Monats', formatWeekRange('2026-W28'), '6.7. – 12.7.2026')
pruefe('Über den Jahreswechsel', formatWeekRange('2026-W01'), '29.12. – 4.1.2026')

console.log('\nLängste Serie:')

pruefe('Leere Menge', longestStreakOf([]), 0)
pruefe('Ein einzelner Tag', longestStreakOf(['2026-07-28']), 1)
pruefe(
  'Drei Tage in Folge, unsortiert übergeben',
  longestStreakOf(['2026-07-29', '2026-07-27', '2026-07-28']),
  3,
)
pruefe(
  'Eine Lücke unterbricht',
  longestStreakOf(['2026-07-27', '2026-07-28', '2026-07-30', '2026-07-31']),
  2,
)
pruefe('Doppelte Tage zählen einmal', longestStreakOf(['2026-07-27', '2026-07-27']), 1)
pruefe('Über den Monatswechsel', longestStreakOf(['2026-07-31', '2026-08-01']), 2)
pruefe(
  'Über die Zeitumstellung Ende März',
  longestStreakOf(['2026-03-28', '2026-03-29', '2026-03-30']),
  3,
)

console.log(`\n${bestanden} bestanden, ${gescheitert} gescheitert.`)
process.exit(gescheitert > 0 ? 1 : 0)
