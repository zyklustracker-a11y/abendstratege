/**
 * ────────────────────────────────────────────────────────────────────────────
 *  HIER DIE WERTE AUS DER FIREBASE-KONSOLE EINTRAGEN
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Diese Werte sind NICHT geheim. Sie stehen in jeder Firebase-Web-App offen im
 * Quelltext und dürfen eingecheckt werden – geschützt wird das Konto durch die
 * Firestore-Regeln (firestore.rules) und die Liste der erlaubten Domains,
 * nicht durch Geheimhaltung dieser Schlüssel.
 *
 * Zu finden unter:
 *   Firebase-Konsole → Zahnrad → Projekteinstellungen → Allgemein
 *   → Abschnitt „Meine Apps“ → Web-App → „SDK-Einrichtung und Konfiguration“
 *
 * Der VAPID-Schlüssel unten ist der ÖFFENTLICHE Schlüssel des Push-Paares.
 * Er gehört ebenfalls in den Quelltext. Der zugehörige PRIVATE Schlüssel
 * gehört ausschließlich in die GitHub-Secrets (siehe SETUP.md).
 *
 * Alternativ lassen sich alle Werte über Umgebungsvariablen setzen
 * (.env-Datei, siehe .env.example) – die haben Vorrang vor den Werten hier.
 */

const env = import.meta.env

function value(fromEnv: string | undefined, fallback: string): string {
  return (fromEnv ?? '').trim() || fallback
}

export const firebaseConfig = {
  apiKey: value(env.VITE_FIREBASE_API_KEY, 'HIER_API_KEY_EINTRAGEN'),
  authDomain: value(env.VITE_FIREBASE_AUTH_DOMAIN, 'HIER_AUTH_DOMAIN_EINTRAGEN'),
  projectId: value(env.VITE_FIREBASE_PROJECT_ID, 'HIER_PROJECT_ID_EINTRAGEN'),
  storageBucket: value(env.VITE_FIREBASE_STORAGE_BUCKET, 'HIER_STORAGE_BUCKET_EINTRAGEN'),
  messagingSenderId: value(env.VITE_FIREBASE_MESSAGING_SENDER_ID, 'HIER_SENDER_ID_EINTRAGEN'),
  appId: value(env.VITE_FIREBASE_APP_ID, 'HIER_APP_ID_EINTRAGEN'),
}

/** Öffentlicher VAPID-Schlüssel für Web Push. Darf im Quelltext stehen. */
export const vapidPublicKey = value(env.VITE_VAPID_PUBLIC_KEY, 'HIER_VAPID_PUBLIC_KEY_EINTRAGEN')

const placeholder = (v: string) => v.startsWith('HIER_')

/** Solange Platzhalter drinstehen, zeigt die App einen erklärenden Hinweis statt eines Absturzes. */
export const firebaseConfigured = !Object.values(firebaseConfig).some(placeholder)
export const pushConfigured = !placeholder(vapidPublicKey)
