/**
 * Die Terminentscheidung des Versands – bewusst als reine Funktionen, damit
 * sie ohne Firestore und ohne Push-Dienst geprüft werden können
 * (siehe test-schedule.mjs).
 */

/**
 * Wie lange nach der eingestellten Uhrzeit noch zugestellt wird. Der Cron von
 * GitHub läuft nicht auf die Minute genau; ohne Nachlauf fiele eine Erinnerung
 * bei einem verspäteten Lauf ganz aus.
 */
export const NACHLAUF_MINUTEN = 90

/** Lokales Datum und Minuten seit Mitternacht in der Zeitzone des Nutzers. */
export function localParts(timeZone, now) {
  const build = (zone) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })

  let formatter
  try {
    formatter = build(timeZone)
  } catch {
    // Unbekannte Zone – lieber Berlin als gar keine Erinnerung.
    formatter = build('Europe/Berlin')
  }

  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

export function minutesOf(time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '')
  if (!match) return 21 * 60
  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * Ist für dieses Konto jetzt eine Erinnerung fällig?
 *
 * Bewusst nur vorwärts: Um 00:15 wird nicht die Erinnerung des Vortages
 * nachgereicht – der Abend ist dann vorbei.
 */
export function istFaellig(reminder, jetzt) {
  const { date, minutes } = localParts(reminder?.timeZone, jetzt)
  const ziel = minutesOf(reminder?.time)

  if (reminder?.lastSentLocalDate === date) return { faellig: false, date, grund: 'heute-schon' }
  if (minutes < ziel) return { faellig: false, date, grund: 'zu-frueh' }
  if (minutes >= ziel + NACHLAUF_MINUTEN) return { faellig: false, date, grund: 'zu-spaet' }
  return { faellig: true, date, grund: 'faellig' }
}
