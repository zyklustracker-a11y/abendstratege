let counter = 0

/** Stabile id für Bereiche, Bereichs-Reflexionen und Hiebe. */
export function newId(prefix = 'id'): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
