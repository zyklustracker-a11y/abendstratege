import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { firebaseConfig, firebaseConfigured } from './firebase-config'

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

function ensureApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error('Firebase ist noch nicht konfiguriert – siehe src/lib/firebase-config.ts')
  }
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function auth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(ensureApp())
    // Angemeldet bleiben, bis aktiv abgemeldet wird – auch nach Schließen der App.
    void setPersistence(authInstance, browserLocalPersistence)
  }
  return authInstance
}

export function db(): Firestore {
  if (!dbInstance) {
    // Eigener lokaler Cache: Lesen funktioniert offline, Schreibvorgänge werden
    // nachgeholt, sobald die Verbindung zurück ist.
    dbInstance = initializeFirestore(ensureApp(), {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
    })
  }
  return dbInstance
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}
