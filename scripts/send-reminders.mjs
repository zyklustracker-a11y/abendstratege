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
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import webpush from 'web-push'
import { istFaellig, localParts } from './schedule.mjs'

const MODUS = (process.env.MODUS ?? 'plan').toLowerCase()
const NUR_EMAIL = (process.env.NUR_EMAIL ?? '').trim().toLowerCase()

const TITEL = 'Der Abendstratege'
const TEXT = 'Nimm dir jetzt kurz Zeit für deine Reflexion.'

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
 */
async function zustellen(uid) {
  const devices = await db.collection(`users/${uid}/devices`).get()
  if (devices.empty) {
    console.log(`  keine Geräte hinterlegt`)
    return 0
  }

  let erfolge = 0
  for (const device of devices.docs) {
    const data = device.data()
    if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
      await device.ref.delete()
      continue
    }

    try {
      await webpush.sendNotification(
        { endpoint: data.endpoint, keys: { p256dh: data.keys.p256dh, auth: data.keys.auth } },
        payload,
        { TTL: 3 * 60 * 60, urgency: 'normal' },
      )
      erfolge++
      console.log(`  zugestellt an ${data.label ?? 'Gerät'}`)
    } catch (error) {
      const status = error?.statusCode
      if (status === 404 || status === 410) {
        await device.ref.delete()
        console.log(`  Abo abgelaufen, entfernt (${data.label ?? 'Gerät'})`)
      } else {
        console.error(`  Fehler ${status ?? '?'} bei ${data.label ?? 'Gerät'}: ${error?.message}`)
      }
    }
  }
  return erfolge
}

async function main() {
  const jetzt = new Date()
  const users = await db.collection('users').where('reminder.enabled', '==', true).get()

  console.log(
    `Modus: ${MODUS} · ${users.size} Konto/Konten mit aktiver Erinnerung · ${jetzt.toISOString()}`,
  )

  let verschickt = 0

  for (const user of users.docs) {
    const uid = user.id
    const reminder = user.get('reminder') ?? {}
    const email = (user.get('profile')?.email ?? '').toLowerCase()

    if (MODUS === 'test' && NUR_EMAIL && email !== NUR_EMAIL) continue

    const { date } = localParts(reminder.timeZone, jetzt)

    if (MODUS !== 'test') {
      if (!istFaellig(reminder, jetzt).faellig) continue
      if (await hatReflektiert(uid, date)) {
        console.log(`${email || uid}: heute bereits reflektiert – keine Erinnerung`)
        // Als erledigt vermerken, damit später am Abend nicht doch noch etwas rausgeht.
        await user.ref.set({ reminder: { lastSentLocalDate: date } }, { merge: true })
        continue
      }
    }

    console.log(`${email || uid}: sende (lokal ${date}, ${reminder.time ?? '21:00'})`)
    const erfolge = await zustellen(uid)
    if (erfolge > 0) {
      verschickt++
      if (MODUS !== 'test') {
        await user.ref.set({ reminder: { lastSentLocalDate: date } }, { merge: true })
      }
    }
  }

  console.log(`Fertig – ${verschickt} Konto/Konten benachrichtigt.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
