/**
 * Brücke zum Ladebildschirm in index.html.
 *
 * Er lebt bewusst außerhalb von React: Er steht schon beim ersten Paint, lange
 * bevor dieses Bundle geladen ist. Von hier bekommt er nur zwei Dinge – wie
 * weit die App ist, und wann sie wirklich fertig gerendert ist.
 *
 * Alle Aufrufe sind harmlos, wenn der Bildschirm gar nicht da ist: Er entfernt
 * sich selbst aus dem Dokument und räumt dabei auch dieses Objekt nicht weg,
 * die Aufrufe laufen dann ins Leere.
 */
interface SplashBruecke {
  fortschritt: (prozent: number) => void
  bereit: () => void
}

function bruecke(): SplashBruecke | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { __abendstrategeSplash?: SplashBruecke }).__abendstrategeSplash
}

/** Ein Zwischenstand in Prozent. Rückschritte ignoriert der Bildschirm von sich aus. */
export function splashFortschritt(prozent: number): void {
  bruecke()?.fortschritt(prozent)
}

/**
 * Die App ist vollständig renderbereit. Der Bildschirm blendet danach aus –
 * frühestens nach seiner Mindestdauer, damit nichts ruckartig umspringt.
 */
export function splashFertig(): void {
  bruecke()?.bereit()
}
