import type { AreaKey, Goals } from '../lib/types'
import { GoalFields } from './GoalFields'

interface Props {
  draft: Goals
  saved: boolean
  onChange: (area: AreaKey, value: string) => void
  onSave: () => void
}

/** Die fünf Leitziele – jederzeit einsehbar und bearbeitbar. */
export function ZieleView({ draft, saved, onChange, onSave }: Props) {
  return (
    <div className="fade-in">
      <h2 className="view-title">Meine Ziele</h2>
      <p className="ziele__lead">
        Deine fünf übergeordneten Leitziele. Jeder Erfolg wird an ihnen gemessen – halte sie scharf.
      </p>

      <GoalFields idPrefix="ziele" values={draft} onChange={onChange} variant="ziele" />

      <div className="ziele__actions">
        <button type="button" className="btn-primary" onClick={onSave}>
          Ziele speichern
        </button>
        {saved && (
          <span className="ziele__saved" role="status">
            Gespeichert.
          </span>
        )}
      </div>
    </div>
  )
}
