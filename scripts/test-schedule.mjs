/**
 * Prüft die Terminentscheidung des Versands – ohne Firestore, ohne Push-Dienst.
 *
 *   node scripts/test-schedule.mjs
 */
import { istFaellig, localParts, minutesOf } from './schedule.mjs'

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

const berlin = { enabled: true, time: '21:00', timeZone: 'Europe/Berlin' }

console.log('Zeitpunkt der Erinnerung:')

// 28. Juli 2026, 19:05 UTC = 21:05 in Berlin (Sommerzeit).
pruefe(
  'Berlin 21:05 – fällig',
  istFaellig(berlin, new Date('2026-07-28T19:05:00Z')).faellig,
  true,
)

pruefe(
  'Berlin 20:45 – noch zu früh',
  istFaellig(berlin, new Date('2026-07-28T18:45:00Z')).grund,
  'zu-frueh',
)

pruefe(
  'Berlin 22:15 – innerhalb des Nachlaufs',
  istFaellig(berlin, new Date('2026-07-28T20:15:00Z')).faellig,
  true,
)

pruefe(
  'Berlin 23:00 – Nachlauf vorbei',
  istFaellig(berlin, new Date('2026-07-28T21:00:00Z')).grund,
  'zu-spaet',
)

pruefe(
  'Nach Mitternacht wird nichts nachgereicht',
  istFaellig(berlin, new Date('2026-07-28T22:20:00Z')).grund,
  'zu-frueh',
)

pruefe(
  'Heute bereits verschickt – kein zweites Mal',
  istFaellig(
    { ...berlin, lastSentLocalDate: '2026-07-28' },
    new Date('2026-07-28T19:30:00Z'),
  ).grund,
  'heute-schon',
)

pruefe(
  'Der Vermerk von gestern blockiert heute nicht',
  istFaellig(
    { ...berlin, lastSentLocalDate: '2026-07-27' },
    new Date('2026-07-28T19:30:00Z'),
  ).faellig,
  true,
)

console.log('\nZeitzonen:')

// Dieselbe Weltzeit trifft verschiedene Zonen zu verschiedenen Ortszeiten.
const um1905utc = new Date('2026-07-28T19:05:00Z')

pruefe(
  'Berlin ist um 19:05 UTC fällig',
  istFaellig({ ...berlin, timeZone: 'Europe/Berlin' }, um1905utc).faellig,
  true,
)

pruefe(
  'New York ist um dieselbe Zeit erst 15:05 – nicht fällig',
  istFaellig({ ...berlin, timeZone: 'America/New_York' }, um1905utc).grund,
  'zu-frueh',
)

pruefe(
  'Tokio ist um dieselbe Zeit 04:05 des Folgetages – nicht fällig',
  istFaellig({ ...berlin, timeZone: 'Asia/Tokyo' }, um1905utc).grund,
  'zu-frueh',
)

pruefe(
  'New York wird um 01:05 UTC erreicht (21:05 Ortszeit)',
  istFaellig({ ...berlin, timeZone: 'America/New_York' }, new Date('2026-07-29T01:05:00Z'))
    .faellig,
  true,
)

pruefe(
  'Das lokale Datum in New York ist dann noch der 28.',
  localParts('America/New_York', new Date('2026-07-29T01:05:00Z')).date,
  '2026-07-28',
)

console.log('\nWinterzeit (die Umstellung darf nichts verschieben):')

// 15. Januar 2026, 20:05 UTC = 21:05 in Berlin (Normalzeit, UTC+1).
pruefe(
  'Berlin 21:05 im Januar – fällig',
  istFaellig(berlin, new Date('2026-01-15T20:05:00Z')).faellig,
  true,
)

pruefe(
  'Im Januar ist 19:05 UTC erst 20:05 – nicht fällig',
  istFaellig(berlin, new Date('2026-01-15T19:05:00Z')).grund,
  'zu-frueh',
)

console.log('\nRobustheit:')

pruefe(
  'Unbekannte Zeitzone fällt auf Berlin zurück',
  localParts('Mars/Olympus', um1905utc),
  localParts('Europe/Berlin', um1905utc),
)

pruefe('Fehlende Uhrzeit ergibt 21:00', minutesOf(undefined), 21 * 60)
pruefe('Unsinnige Uhrzeit ergibt 21:00', minutesOf('abends'), 21 * 60)
pruefe('07:30 wird gelesen', minutesOf('07:30'), 7 * 60 + 30)
pruefe('Mitternacht wird gelesen', minutesOf('00:00'), 0)

console.log(`\n${bestanden} bestanden, ${gescheitert} gescheitert.`)
process.exit(gescheitert > 0 ? 1 : 0)
