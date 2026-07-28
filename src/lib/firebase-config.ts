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
  apiKey: value(env.VITE_FIREBASE_API_KEY, 'AIzaSyDLCcc0O_1h9EDXaRPUx5IPgVjDRYAl-Kk'),
  /**
   * Bewusst `web.app` statt des von der Konsole vorgeschlagenen
   * `abendstrategen.firebaseapp.com`: Die App läuft unter dieser Adresse, und
   * der Anmelde-Helfer liegt damit auf derselben Domain. Auf dem iPhone im
   * Homescreen-Modus sperrt Safari sonst die Rückkehr von Google.
   */
  authDomain: value(env.VITE_FIREBASE_AUTH_DOMAIN, 'abendstrategen.web.app'),
  projectId: value(env.VITE_FIREBASE_PROJECT_ID, 'abendstrategen'),
  storageBucket: value(env.VITE_FIREBASE_STORAGE_BUCKET, 'abendstrategen.firebasestorage.app'),
  messagingSenderId: value(env.VITE_FIREBASE_MESSAGING_SENDER_ID, '369654552258'),
  appId: value(env.VITE_FIREBASE_APP_ID, '1:369654552258:web:9c8bf2f9f8a76340ea8d5b'),
}

/** Öffentlicher VAPID-Schlüssel für Web Push. Darf im Quelltext stehen. */
export const vapidPublicKey = value(
  env.VITE_VAPID_PUBLIC_KEY,
  'BCj6FHwehR0oz1uqic3cpsfIK-zJeP9Hb702WDN61MZOHOtnLT5HJsQCN_sa8QtAtWVNEZ3dlacEtdSNfyPKQb4',
)

const placeholder = (v: string) => v.startsWith('HIER_')

/** Solange Platzhalter drinstehen, zeigt die App einen erklärenden Hinweis statt eines Absturzes. */
export const firebaseConfigured = !Object.values(firebaseConfig).some(placeholder)
export const pushConfigured = !placeholder(vapidPublicKey)
