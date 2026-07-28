import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { CURRENT_VERSION, emptyState, parseState, reminderOf } from './storage'
import type { Entry, PersistedState, PushDevice, Reminder } from './types'

/**
 * Ablage in Firestore – bewusst nach Änderungshäufigkeit getrennt:
 *
 *   users/{uid}                     Bereiche, Ziele, Einstellungen, Entwurf
 *   users/{uid}/entries/{YYYY-MM-DD}  ein Dokument pro Abend
 *   users/{uid}/devices/{geraeteId}   Push-Abo je Gerät
 *
 * Ein Abend als eigenes Dokument statt alles in einem: So bleibt jede Änderung
 * ein kleiner Schreibvorgang, und der Stand wächst nicht gegen das
 * Dokumentenlimit von 1 MiB.
 */

const userDoc = (uid: string) => doc(db(), 'users', uid)
const entriesCol = (uid: string) => collection(db(), 'users', uid, 'entries')
const entryDoc = (uid: string, date: string) => doc(db(), 'users', uid, 'entries', date)
const devicesCol = (uid: string) => collection(db(), 'users', uid, 'devices')
const deviceDoc = (uid: string, id: string) => doc(db(), 'users', uid, 'devices', id)

/** Firestore lehnt `undefined` ab – optionale Felder werden vorher entfernt. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function rootPayload(state: PersistedState) {
  return clean({
    version: CURRENT_VERSION,
    areas: state.areas,
    setupDone: state.setupDone,
    legacyFormula: state.legacyFormula,
    draft: state.draft,
    reminder: state.reminder,
  })
}

/** Lädt den kompletten Stand eines Kontos. */
export async function loadRemote(uid: string): Promise<PersistedState | null> {
  const [root, entrySnap] = await Promise.all([getDoc(userDoc(uid)), getDocs(entriesCol(uid))])
  if (!root.exists()) return null

  const data = root.data()
  const base = parseState({ ...data, version: CURRENT_VERSION, entries: [] })
  base.entries = entrySnap.docs
    .map((d) => parseState({ version: CURRENT_VERSION, entries: [{ ...d.data(), date: d.id }] }))
    .flatMap((s) => s.entries)
  base.reminder = reminderOf(data.reminder)
  return base
}

/** Legt ein Konto an – entweder leer oder mit dem übernommenen lokalen Stand. */
export async function createRemote(uid: string, state: PersistedState): Promise<void> {
  const batch = writeBatch(db())
  batch.set(userDoc(uid), { ...rootPayload(state), createdAt: serverTimestamp() })
  for (const entry of state.entries) batch.set(entryDoc(uid, entry.date), clean(entry))
  await batch.commit()
}

/** Profildaten fürs Konto – rein informativ, damit der Einstellungsbereich sie zeigen kann. */
export async function saveProfile(user: User): Promise<void> {
  await setDoc(
    userDoc(user.uid),
    {
      profile: {
        name: user.displayName ?? '',
        email: user.email ?? '',
        photoURL: user.photoURL ?? '',
      },
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  )
}

function sameEntry(a: Entry | undefined, b: Entry | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function sameRoot(a: PersistedState, b: PersistedState): boolean {
  return JSON.stringify(rootPayload(a)) === JSON.stringify(rootPayload(b))
}

/**
 * Schreibt nur, was sich tatsächlich geändert hat. Der Entwurf wird bei jedem
 * Tastendruck fortgeschrieben – ohne diesen Abgleich wären das pro Abend
 * hunderte überflüssige Schreibvorgänge auf jedes Abend-Dokument.
 */
export async function persistRemote(
  uid: string,
  previous: PersistedState,
  next: PersistedState,
): Promise<void> {
  const batch = writeBatch(db())
  let dirty = false

  if (!sameRoot(previous, next)) {
    batch.set(userDoc(uid), { ...rootPayload(next), updatedAt: serverTimestamp() }, { merge: true })
    dirty = true
  }

  const before = new Map(previous.entries.map((e) => [e.date, e]))
  const after = new Map(next.entries.map((e) => [e.date, e]))

  for (const [date, entry] of after) {
    if (sameEntry(before.get(date), entry)) continue
    batch.set(entryDoc(uid, date), clean(entry))
    dirty = true
  }
  for (const date of before.keys()) {
    if (after.has(date)) continue
    batch.delete(entryDoc(uid, date))
    dirty = true
  }

  if (dirty) await batch.commit()
}

export async function saveReminder(uid: string, reminder: Reminder): Promise<void> {
  await setDoc(userDoc(uid), { reminder: clean(reminder) }, { merge: true })
}

export async function saveDevice(uid: string, device: PushDevice): Promise<void> {
  await setDoc(deviceDoc(uid, device.id), clean(device), { merge: true })
}

export async function removeDevice(uid: string, deviceId: string): Promise<void> {
  await deleteDoc(deviceDoc(uid, deviceId))
}

export async function deviceExists(uid: string, deviceId: string): Promise<boolean> {
  const snap = await getDoc(deviceDoc(uid, deviceId))
  return snap.exists()
}

export async function countDevices(uid: string): Promise<number> {
  const snap = await getDocs(devicesCol(uid))
  return snap.size
}

export { emptyState }
