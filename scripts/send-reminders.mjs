/**
 * Versand der Abend-Erinnerungen.
 *
 * Läuft als GitHub-Action im Viertelstundentakt (siehe
 * .github/workflows/reminder.yml) und ersetzt damit eine Cloud Function –
 * die einen kostenpflichtigen Tarif voraussetzen würde.
 *
 * Ablauf je Nutzer mit aktivierter Erinnerung:
 *   1. Lokale Zeit in seiner Zeitzone bestimmen.
 *   2. Ist die eingestellte Uhrzeit erreicht und heute noch nichts raus?
 *   3. Hat er heute schon reflektiert? Dann bleibt es still.
 *   4. An alle hinterlegten Geräte zustellen, abgelaufene Abos entfernen.
 *
 * Umgebungsvariablen:
 *   FIREBASE_SERVICE_ACCOUNT  JSON des Dienstkontos (geheim)
 *   VAPID_PUBLIC_KEY          öffentlicher Push-Schlüssel
 *   VAPID_PRIVATE_KEY         privater Push-Schlüssel (geheim)
 *   VAPID_SUBJECT             mailto:… – von Apple verlangt
 *   MODUS                     'plan' (Standard) oder 'test'
 *   NUR_EMAIL                 im Testmodus optional auf ein Konto begrenzen
 */
import { appendFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import webpush from 'web-push'
import { NACHLAUF_MINUTEN, istFaellig, localParts } from './schedule.mjs'

const MODUS = (process.env.MODUS ?? 'plan').toLowerCase()
const NUR_EMAIL = (process.env.NUR_EMAIL ?? '').trim().toLowerCase()

/**
 * Der echte Versandtext. Derselbe Wortlaut steht in src/lib/constants.ts
 * (Testbenachrichtigung in der App) und in public/sw.js (Rückfallwerte im
 * Service Worker); die drei Umgebungen können sich nichts teilen, deshalb
 * gehören sie zusammen geändert. Der Titel nennt den App-Namen nicht – das
 * Betriebssystem stellt ihn der Benachrichtigung voran.
 */
const TITEL = 'Zeit für deine Reflexion'
const TEXT = 'Ein Erfolg von heute – und ein Hieb für morgen.'

function requireEnv(name) {
  const value = (process.env[name] ?? '').trim()
  if (!value) {
    console.error(`Fehlende Umgebungsvariable: ${name}`)
    process.exit(1)
  }
  return value
}

const serviceAccount = JSON.parse(requireEnv('FIREBASE_SERVICE_ACCOUNT'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT?.trim() || 'mailto:abendstratege@example.com',
  requireEnv('VAPID_PUBLIC_KEY'),
  requireEnv('VAPID_PRIVATE_KEY'),
)

/** Wurde an diesem lokalen Tag bereits reflektiert? */
async function hatReflektiert(uid, datum) {
  const snap = await db.doc(`users/${uid}/entries/${datum}`).get()
  if (!snap.exists) return false
  const reflections = snap.get('reflections')
  return Array.isArray(reflections) && reflections.length > 0
}

const payload = JSON.stringify({
  title: TITEL,
  body: TEXT,
  url: '/?view=reflect',
  icon: '/icon-192.png',
  badge: '/badge-72.png',
  tag: 'abend-erinnerung',
})

/**
 * Stellt an alle Geräte eines Kontos zu. Abos, die der Push-Dienst nicht mehr
 * kennt (404/410), werden entfernt – sonst sammeln sich tote Einträge an.
 * Andere Fehler werden zurückgemeldet statt nur protokolliert: Ein 403 heißt in
 * der Regel, dass der öffentliche VAPID-Schlüssel der App und das Paar in den
 * Secrets nicht zusammengehören – ein Zustand, den der Lauf melden muss.
 */
async function zustellen(uid, kennung) {
  const devices = await db.collection(`users/${uid}/devices`).get()
  const ergebnis = { geraete: devices.size, erfolge: 0, entfernt: 0, fehler: [] }

  if (devices.empty) {
    console.log('  keine Geräte hinterlegt')
    return ergebnis
  }

  for (const device of devices.docs) {
    const data = device.data()
    const label = data.label ?? 'Gerät'
    if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
      await device.ref.delete()
      ergebnis.entfernt++
      console.log(`  unvollständiges Abo entfernt (${label})`)
      continue
    }

    try {
      await webpush.sendNotification(
        { endpoint: data.endpoint, keys: { p256dh: data.keys.p256dh, auth: data.keys.auth } },
        payload,
        { TTL: 3 * 60 * 60, urgency: 'normal' },
      )
      ergebnis.erfolge++
      console.log(`  zugestellt an ${label}`)
    } catch (error) {
      const status = error?.statusCode
      if (status === 404 || status === 410) {
        await device.ref.delete()
        ergebnis.entfernt++
        console.log(`  Abo abgelaufen, entfernt (${label})`)
      } else {
        ergebnis.fehler.push({ konto: kennung, label, status: status ?? '?', text: error?.message })
        console.error(`  Fehler ${status ?? '?'} bei ${label}: ${error?.message}`)
      }
    }
  }
  return ergebnis
}

/**
 * Was dieser Lauf getan hat, in einer Form, die in der Actions-Übersicht lesbar
 * ist. Ohne sie steht dort nur „erfolgreich“, auch wenn nichts angekommen ist.
 */
function schreibeZusammenfassung(zeilen) {
  console.log(`\n${zeilen.join('\n')}`)
  const ziel = process.env.GITHUB_STEP_SUMMARY
  if (!ziel) return
  try {
    appendFileSync(ziel, `${zeilen.join('\n')}\n`)
  } catch (error) {
    console.error(`Zusammenfassung nicht geschrieben: ${error?.message}`)
  }
}

async function main() {
  const jetzt = new Date()
  const users = await db.collection('users').where('reminder.enabled', '==', true).get()

  console.log(
    `Modus: ${MODUS} · ${users.size} Konto/Konten mit aktiver Erinnerung · ${jetzt.toISOString()}`,
  )

  const bilanz = {
    geprueft: users.size,
    faellig: 0,
    zugestellt: 0,
    entfernt: 0,
    zuFrueh: 0,
    zuSpaet: 0,
    heuteSchon: 0,
    bereitsReflektiert: 0,
    ohneGeraet: [],
    fehler: [],
  }

  for (const user of users.docs) {
    const uid = user.id
    const reminder = user.get('reminder') ?? {}
    const email = (user.get('profile')?.email ?? '').toLowerCase()
    const kennung = email || uid

    if (MODUS === 'test' && NUR_EMAIL && email !== NUR_EMAIL) continue

    const { date } = localParts(reminder.timeZone, jetzt)

    if (MODUS !== 'test') {
      const { faellig, grund } = istFaellig(reminder, jetzt)
      if (!faellig) {
        if (grund === 'zu-frueh') bilanz.zuFrueh++
        if (grund === 'heute-schon') bilanz.heuteSchon++
        if (grund === 'zu-spaet') {
          // Sonst bleibt der häufigste Grund für ein stilles Ausfallen unsichtbar:
          // Der Cron kam zu spät, und der Nachlauf war schon abgelaufen.
          bilanz.zuSpaet++
          console.log(
            `${kennung}: übersprungen – Nachlauf von ${NACHLAUF_MINUTEN} Minuten nach ${reminder.time ?? '21:00'} bereits vorbei (lokal ${date})`,
          )
        }
        continue
      }
      bilanz.faellig++

      if (await hatReflektiert(uid, date)) {
        bilanz.bereitsReflektiert++
        console.log(`${kennung}: heute bereits reflektiert – keine Erinnerung`)
        // Als erledigt vermerken, damit später am Abend nicht doch noch etwas rausgeht.
        await user.ref.set({ reminder: { lastSentLocalDate: date } }, { merge: true })
        continue
      }
    } else {
      bilanz.faellig++
    }

    console.log(`${kennung}: sende (lokal ${date}, ${reminder.time ?? '21:00'})`)
    const ergebnis = await zustellen(uid, kennung)
    bilanz.entfernt += ergebnis.entfernt
    bilanz.fehler.push(...ergebnis.fehler)

    if (ergebnis.erfolge > 0) {
      bilanz.zugestellt++
      if (MODUS !== 'test') {
        await user.ref.set({ reminder: { lastSentLocalDate: date } }, { merge: true })
      }
    } else {
      // Fällig, aber nichts angekommen – genau der Fall, der bisher unbemerkt blieb.
      bilanz.ohneGeraet.push({ konto: kennung, geraete: ergebnis.geraete })
    }
  }

  const zeilen = [
    '## Abend-Erinnerung',
    '',
    `Modus **${MODUS}** · ${jetzt.toISOString()}`,
    '',
    `- geprüfte Konten: ${bilanz.geprueft}`,
    `- fällig: ${bilanz.faellig}`,
    `- zugestellt: ${bilanz.zugestellt}`,
    `- heute bereits reflektiert: ${bilanz.bereitsReflektiert}`,
    `- noch zu früh: ${bilanz.zuFrueh} · Nachlauf vorbei: ${bilanz.zuSpaet} · heute schon verschickt: ${bilanz.heuteSchon}`,
    `- entfernte Abos: ${bilanz.entfernt}`,
  ]

  const probleme = []
  if (bilanz.geprueft === 0) {
    probleme.push(
      'Kein Konto mit aktiver Erinnerung gefunden. Der Versand filtert über `reminder.enabled == true` – fehlt das Feld oder steht es auf `false`, wird das Konto nie gefunden.',
    )
  }
  for (const { konto, geraete } of bilanz.ohneGeraet) {
    probleme.push(
      geraete === 0
        ? `${konto}: fällig, aber kein Gerät im Verteiler (\`users/{uid}/devices\` ist leer).`
        : `${konto}: fällig, aber Zustellung an alle ${geraete} Geräte fehlgeschlagen.`,
    )
  }
  for (const { konto, label, status, text } of bilanz.fehler) {
    probleme.push(
      `${konto} · ${label}: Fehler ${status}${status === 403 || status === 401 ? ' – VAPID-Schlüsselpaar prüfen: der öffentliche Schlüssel in src/lib/firebase-config.ts und das Paar in den Secrets müssen aus demselben Satz stammen' : ''}${text ? ` (${text})` : ''}`,
    )
  }

  if (probleme.length) {
    zeilen.push('', '### Zu klären', ...probleme.map((p) => `- ${p}`))
  }

  schreibeZusammenfassung(zeilen)

  // Sichtbar scheitern: Ein grüner Lauf, bei dem niemand etwas bekommen hat,
  // sieht aus wie ein stilles Nichts – und genau das war das Problem.
  if (probleme.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
