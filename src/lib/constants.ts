/** Vorschlag für den ersten Start – ab dann verwaltet der Nutzer die Bereiche selbst. */
export const DEFAULT_AREAS: ReadonlyArray<readonly [string, string]> = [
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
