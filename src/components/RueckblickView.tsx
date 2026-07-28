import { AREAS } from '../lib/constants'
import { weekKey } from '../lib/date'
import { sortedDesc, statsOf } from '../lib/selectors'
import type { Entry, Filter } from '../lib/types'
import { EntryCard } from './EntryCard'

interface Props {
  entries: Entry[]
  formula: string[]
  impulseWeek: string
  filter: Filter
  expandedId: string | null
  formulaInput: string
  onFilter: (filter: Filter) => void
  onExpand: (date: string | null) => void
  onFormulaInput: (value: string) => void
  onAddFormula: () => void
  onRemoveFormula: (index: number) => void
  onDismissImpulse: () => void
  onGoReflect: () => void
}

export function RueckblickView({
  entries,
  formula,
  impulseWeek,
  filter,
  expandedId,
  formulaInput,
  onFilter,
  onExpand,
  onFormulaInput,
  onAddFormula,
  onRemoveFormula,
  onDismissImpulse,
  onGoReflect,
}: Props) {
  const hasEntries = entries.length > 0
  const { counts, maxCount, hiebeTotal, hiebeDone } = statsOf(entries)
  const visible = sortedDesc(entries).filter(
    (e) =>
      filter === 'alle' ||
      e.area === filter ||
      (e.extras ?? []).some((extra) => extra.area === filter),
  )

  return (
    <div className="fade-in">
      <h2 className="view-title view-title--tight">Rückblick &amp; Muster</h2>

      {hasEntries && (
        <div className="stats">
          <div className="card stats__areas">
            <div className="eyebrow eyebrow--muted">Erfolge nach Lebensbereich</div>
            <div className="stats__rows">
              {AREAS.map(([key, label]) => (
                <div className="stats__row" key={key}>
                  <div className="stats__label">{label}</div>
                  <div className="stats__bar">
                    <div
                      className="stats__fill"
                      style={{ width: `${Math.round((counts[key] / maxCount) * 100)}%` }}
                    />
                  </div>
                  <div className="stats__count">{counts[key]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="stats__side">
            <div className="card stats__card stats__card--grow">
              <div className="eyebrow eyebrow--muted">Umsetzungsquote</div>
              <div className="stats__value">
                {hiebeTotal ? `${Math.round((hiebeDone / hiebeTotal) * 100)} %` : '–'}
              </div>
              <div className="stats__sub">
                {hiebeDone} von {hiebeTotal} Hieben umgesetzt
              </div>
            </div>
            <div className="card stats__card">
              <div className="eyebrow eyebrow--muted">Reflexionen</div>
              <div className="stats__value stats__value--plain">{entries.length}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card formula">
        <div className="eyebrow">Meine Erfolgsformel</div>
        <p className="formula__lead">
          Deine erkannten Erfolgsfaktoren – von dir gepflegt, über die Zeit gewachsen.
        </p>

        {impulseWeek !== weekKey() && (
          <div className="impulse">
            <div className="impulse__text">
              Was hat dich diese Woche wirklich vorangebracht? Geh an den Ursprung und benenne den
              Faktor.
            </div>
            <button
              type="button"
              className="impulse__close"
              title="Für diese Woche ausblenden"
              aria-label="Impuls für diese Woche ausblenden"
              onClick={onDismissImpulse}
            >
              ×
            </button>
          </div>
        )}

        <div className="formula__list">
          {formula.map((text, i) => (
            <div className="formula__item" key={i}>
              <div className="formula__body">
                <span className="diamond" aria-hidden="true">
                  ◆
                </span>
                <span className="formula__text">{text}</span>
              </div>
              <button
                type="button"
                className="formula__remove"
                aria-label={`„${text}“ entfernen`}
                onClick={() => onRemoveFormula(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="formula__form">
          <input
            type="text"
            className="formula-input row__input"
            value={formulaInput}
            placeholder="Neuen Erfolgsfaktor benennen …"
            aria-label="Neuen Erfolgsfaktor benennen"
            onChange={(e) => onFormulaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAddFormula()
            }}
          />
          <button type="button" className="btn-outline formula__submit" onClick={onAddFormula}>
            Aufnehmen
          </button>
        </div>
      </div>

      {hasEntries ? (
        <>
          <div className="filters">
            {([['alle', 'Alle'], ...AREAS] as ReadonlyArray<readonly [Filter, string]>).map(
              ([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={filter === key ? 'chip chip--sm chip--active' : 'chip chip--sm'}
                  aria-pressed={filter === key}
                  onClick={() => onFilter(key)}
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <div className="entries">
            {visible.map((entry) => (
              <EntryCard
                key={entry.date}
                entry={entry}
                expanded={expandedId === entry.date}
                onToggle={() => onExpand(expandedId === entry.date ? null : entry.date)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state__title">Dein Archiv ist noch leer.</div>
          <p className="empty-state__text empty-state__text--narrow">
            Mit jeder Abendreflexion wächst hier dein Rückblick – und mit ihm die Muster deiner
            Erfolge.
          </p>
          <button type="button" className="btn-outline" onClick={onGoReflect}>
            Erste Reflexion beginnen
          </button>
        </div>
      )}
    </div>
  )
}
