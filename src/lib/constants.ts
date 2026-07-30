/**
 * Vorschlag für den ersten Start – ab dann verwaltet der Nutzer die Bereiche
 * selbst. Diese Liste darf frei geändert werden, in Länge wie Inhalt; alles
 * Übrige leitet sich daraus ab. Zwei Bedingungen:
 *
 *   - ids klein, ohne Umlaute und ohne Leerzeichen: sie sind Schlüssel in
 *     Firestore und in GOAL_PLACEHOLDERS.
 *   - eine id, die unten in GOAL_PLACEHOLDERS steht, erbt deren Beispieltext.
 *     Wer das nicht will, wählt eine andere id – so heißt der Bereich
 *     „Mindset & Emotionen“ bewusst `mindset-emotionen` und nicht `mindset`.
 *
 * Die Liste gilt ausschließlich für neu angelegte Konten. Bestehende Konten
 * tragen ihre Bereiche in ihrem eigenen Stand und bleiben unberührt – siehe
 * `readV2()` in storage.ts.
 */
export const DEFAULT_AREAS: ReadonlyArray<readonly [string, string]> = [
  ['physis', 'Physis'],
  ['mindset-emotionen', 'Mindset & Emotionen'],
  ['beziehungen', 'Beziehungen'],
  ['zeit', 'Zeit'],
  ['beruf', 'Beruf, Karriere, Mission'],
  ['finanzen', 'Finanzen'],
  ['mitte', 'Mitte finden'],
]

/**
 * Die Bereiche der allerersten Fassung – historisch und unveränderlich.
 * `migrateV1()` ordnet die dort unter `goals` gespeicherten Ziele über genau
 * diese ids zu. Eine Änderung würde alte Stände auf Bereiche zeigen lassen,
 * die es in ihnen nie gab; sie ist deshalb auch dann nicht fällig, wenn sich
 * DEFAULT_AREAS ändert.
 */
export const LEGACY_V1_AREAS: ReadonlyArray<readonly [string, string]> = [
  ['sport', 'Sportlich'],
  ['business', 'Business'],
  ['mindset', 'Mindset'],
  ['religion', 'Religiös'],
  ['familie', 'Familiär'],
]

export const LEVEL_QUESTIONS = [
  'Was genau lief heute gut?',
  'Was hast du konkret getan?',
  'Was hat diesen Erfolg ermöglicht?',
  'Was sagt das über deine Fähigkeiten und deine Entwicklung aus?',
  'Was bedeutet das im großen Bild für dich?',
] as const

/**
 * Beispieltexte zu den ids der ersten Fassung, die Konten von damals weiterhin
 * tragen. Für die heutige Vorgabeliste ist bewusst keiner hinterlegt: Das
 * Leitziel soll niemandem vorformuliert werden – dort greift der Fallback.
 */
export const GOAL_PLACEHOLDERS: Record<string, string> = {
  sport: 'z. B. Dreimal pro Woche trainieren – konsequent, nicht perfekt.',
  business: 'z. B. Mein Geschäft dieses Jahr um 20 % wachsen lassen.',
  mindset: 'z. B. Gelassen bleiben und aus Reflexion statt Reflex handeln.',
  religion: 'z. B. Jeden Tag mit geistlicher Praxis beginnen.',
  familie: 'z. B. Ungeteilte Präsenz für meine Familie – jeden Tag.',
}

export const GOAL_PLACEHOLDER_FALLBACK = 'Dein übergeordnetes Ziel in diesem Bereich.'

/** Schritte eines Bereichs-Durchlaufs: Erfolg, Ebenen, Warum, Ausweiten, Next Steps. */
export const RUN_STEPS = 5

/** Mehr als fünf Handlungen für einen Tag wären keine Auswahl mehr. */
export const MAX_HIEBE = 5

/** Voreinstellung der Abend-Erinnerung. */
export const DEFAULT_REMINDER_TIME = '21:00'

export const NOTIFICATION_TITLE = 'Der Abendstratege'
export const NOTIFICATION_BODY = 'Nimm dir jetzt kurz Zeit für deine Reflexion.'
