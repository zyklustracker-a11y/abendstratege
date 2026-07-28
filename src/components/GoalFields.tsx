import { AREAS, GOAL_PLACEHOLDERS } from '../lib/constants'
import type { AreaKey, Goals } from '../lib/types'

interface Props {
  idPrefix: string
  values: Goals
  onChange: (area: AreaKey, value: string) => void
  variant?: 'setup' | 'ziele'
}

/** Die fünf Leitziele – identisch in der Einrichtung und im Bereich „Meine Ziele“. */
export function GoalFields({ idPrefix, values, onChange, variant = 'setup' }: Props) {
  return (
    <div className={variant === 'ziele' ? 'fields fields--ziele' : 'fields'}>
      {AREAS.map(([key, label]) => (
        <div className="field" key={key}>
          <label className="eyebrow" htmlFor={`${idPrefix}-${key}`}>
            {label}
          </label>
          <textarea
            id={`${idPrefix}-${key}`}
            className="goal-textarea"
            rows={2}
            value={values[key]}
            placeholder={GOAL_PLACEHOLDERS[key]}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}
