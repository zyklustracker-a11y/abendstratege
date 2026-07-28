import { hiebMeta } from '../../lib/selectors'
import type { Hieb } from '../../lib/types'

interface Props {
  streak: number
  hiebe: Hieb[]
  onMorgen: () => void
  onEdit: () => void
}

export function DoneStage({ streak, hiebe, onMorgen, onEdit }: Props) {
  return (
    <div className="done fade-in--slow">
      <div className="done__mark" aria-hidden="true">
        ◆
      </div>
      <h2 className="done__title">Festgehalten.</h2>
      <p className="done__lead">
        {streak > 1
          ? `Das ist dein ${streak}. Abend in Folge. Deine Hiebe für morgen stehen.`
          : 'Deine Reflexion ist gespeichert. Deine Hiebe für morgen stehen.'}
      </p>

      <div className="card done__card">
        <div className="eyebrow">Deine Hiebe für morgen</div>
        <div className="done__list">
          {hiebe.map((hieb, i) => (
            <div className="done__item" key={i}>
              <div className="done__n" aria-hidden="true">
                {i + 1}
              </div>
              <div className="done__text">
                {hieb.text} <span className="meta-note">{hiebMeta(hieb)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="done__actions">
        <button type="button" className="btn-primary" onClick={onMorgen}>
          Zum Morgen-Blick
        </button>
        <button type="button" className="btn-ghost" onClick={onEdit}>
          Bearbeiten
        </button>
      </div>
    </div>
  )
}
