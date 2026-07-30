/**
 * Was der Abendstratege ist, in vier Blöcken. Eigene Komponente, weil derselbe
 * Text an zwei Stellen gebraucht wird: beim ersten Start vor den Leitzielen und
 * später in den Einstellungen, wenn man ihn noch einmal nachlesen will.
 */
export function KonzeptText() {
  return (
    <div className="konzept">
      <p className="konzept__lead">
        Jeden Abend hältst du fest, was gelungen ist. Nicht als Tagebuch – als Strategie.
      </p>

      <div className="konzept__block">
        <div className="eyebrow">Bewusstsein</div>
        <p className="konzept__text">
          Erfolge verschwinden, wenn niemand sie benennt. Was du abends aufschreibst, bleibt.
        </p>
      </div>

      <div className="konzept__block">
        <div className="eyebrow">Momentum</div>
        <p className="konzept__text">
          Du beginnst den nächsten Tag nicht bei null, sondern auf dem, was gestern funktioniert
          hat.
        </p>
      </div>

      <div className="konzept__block">
        <div className="eyebrow">Struktur</div>
        <p className="konzept__text">
          Jeder Abend läuft gleich ab: Du wählst einen Lebensbereich, nennst deinen Erfolg,
          vertiefst ihn in fünf Ebenen – und leitest daraus deine Hiebe für morgen ab. Höchstens
          fünf, mindestens einer. Das sind die Handlungen, die tatsächlich etwas bewegen.
        </p>
      </div>

      <p className="konzept__close">Zehn Minuten am Abend. Der Rest ergibt sich daraus.</p>
    </div>
  )
}
