/**
 * Prüft firestore.rules gegen den Firestore-Emulator.
 *
 *   npx firebase emulators:exec --only firestore "node scripts/test-rules.mjs"
 *
 * Kernfrage: Kommt ein angemeldetes Konto an die Daten eines anderen? Genau das
 * darf nie passieren – die App wird weitergegeben, und jeder soll ausschließlich
 * seinen eigenen Stand sehen.
 */
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'

const testEnv = await initializeTestEnvironment({
  projectId: 'abendstratege-rules-test',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
})

const anna = testEnv.authenticatedContext('anna').firestore()
const ben = testEnv.authenticatedContext('ben').firestore()
const fremd = testEnv.unauthenticatedContext().firestore()

let bestanden = 0
let gescheitert = 0

async function pruefe(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    bestanden++
  } catch (error) {
    console.error(`  ✗ ${name}\n    ${error.message}`)
    gescheitert++
  }
}

console.log('Sicherheitsregeln:')

await pruefe('Anna schreibt ihr eigenes Konto', () =>
  assertSucceeds(setDoc(doc(anna, 'users/anna'), { setupDone: true, areas: [] })),
)

await pruefe('Anna liest ihr eigenes Konto', () =>
  assertSucceeds(getDoc(doc(anna, 'users/anna'))),
)

await pruefe('Anna legt einen Abend an', () =>
  assertSucceeds(
    setDoc(doc(anna, 'users/anna/entries/2026-07-28'), {
      date: '2026-07-28',
      reflections: [],
      hiebe: [],
      insight: '',
    }),
  ),
)

await pruefe('Anna hinterlegt ein Push-Gerät', () =>
  assertSucceeds(
    setDoc(doc(anna, 'users/anna/devices/geraet1'), { endpoint: 'https://example.test/x' }),
  ),
)

await pruefe('Ben kommt NICHT an Annas Konto', () =>
  assertFails(getDoc(doc(ben, 'users/anna'))),
)

await pruefe('Ben kommt NICHT an Annas Abende', () =>
  assertFails(getDocs(collection(ben, 'users/anna/entries'))),
)

await pruefe('Ben liest NICHT Annas einzelnen Abend', () =>
  assertFails(getDoc(doc(ben, 'users/anna/entries/2026-07-28'))),
)

await pruefe('Ben kommt NICHT an Annas Push-Geräte', () =>
  assertFails(getDocs(collection(ben, 'users/anna/devices'))),
)

await pruefe('Ben überschreibt NICHT Annas Konto', () =>
  assertFails(setDoc(doc(ben, 'users/anna'), { setupDone: false })),
)

await pruefe('Ben löscht NICHT Annas Abend', () =>
  assertFails(deleteDoc(doc(ben, 'users/anna/entries/2026-07-28'))),
)

await pruefe('Ben arbeitet ungestört in seinem eigenen Konto', () =>
  assertSucceeds(setDoc(doc(ben, 'users/ben'), { setupDone: true })),
)

await pruefe('Nicht angemeldet: kein Lesen', () =>
  assertFails(getDoc(doc(fremd, 'users/anna'))),
)

await pruefe('Nicht angemeldet: kein Schreiben', () =>
  assertFails(setDoc(doc(fremd, 'users/anna'), { setupDone: false })),
)

await pruefe('Sammlung außerhalb von users bleibt zu', () =>
  assertFails(setDoc(doc(anna, 'irgendwas/eintrag'), { x: 1 })),
)

await testEnv.cleanup()

console.log(`\n${bestanden} bestanden, ${gescheitert} gescheitert.`)
process.exit(gescheitert > 0 ? 1 : 0)
