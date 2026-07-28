import type { AreaKey, Goals } from './types'

export const AREAS: ReadonlyArray<readonly [AreaKey, string]> = [
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

export const GOAL_PLACEHOLDERS: Goals = {
  sport: 'z. B. Dreimal pro Woche trainieren – konsequent, nicht perfekt.',
  business: 'z. B. Mein Geschäft dieses Jahr um 20 % wachsen lassen.',
  mindset: 'z. B. Gelassen bleiben und aus Reflexion statt Reflex handeln.',
  religion: 'z. B. Jeden Tag mit geistlicher Praxis beginnen.',
  familie: 'z. B. Ungeteilte Präsenz für meine Familie – jeden Tag.',
}

export const EMPTY_GOALS: Goals = {
  sport: '',
  business: '',
  mindset: '',
  religion: '',
  familie: '',
}

/** Schritte A–F plus der optionale Schritt „Weitere Erfolge“. */
export const STEP_COUNT = 7
export const EXTRAS_STEP = 6

export function areaLabel(key: string): string {
  return AREAS.find(([k]) => k === key)?.[1] ?? ''
}
