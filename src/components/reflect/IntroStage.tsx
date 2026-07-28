interface Props {
  dateLabel: string
  /** Rückblick auf die Hiebe der letzten Reflexion – null, wenn es noch keine gibt. */
  recapText: string | null
  startLabel: string
  onStart: () => void
}

export function IntroStage({ dateLabel, recapText, startLabel, onStart }: Props) {
  return (
    <div className="fade-in">
      <div className="intro__date">{dateLabel}</div>
      <h2 className="intro__title">Guten Abend.</h2>
      <p className="intro__lead">
        Was war heute dein größter Erfolg? Nimm dir gerne bis zu 30 Minuten Zeit – hier drängt
        nichts.
      </p>

      {recapText && (
        <div className="card recap">
          <div className="eyebrow">Der Kreis schließt sich</div>
          <div className="recap__text">{recapText}</div>
          <div className="recap__question">Habe ich auf gestern aufgebaut?</div>
        </div>
      )}

      <button type="button" className="btn-primary intro__start" onClick={onStart}>
        {startLabel}
      </button>
    </div>
  )
}
