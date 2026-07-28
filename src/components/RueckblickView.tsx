import { activeAreas, areaLabel, sortedDesc, statsOf, usedAreaIds } from '../lib/selectors'
import type { Area, Entry, Filter } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'
import { EntryCard } from './EntryCard'

interface Props {
  entries: Entry[]
  areas: Area[]
  filter: Filter
  expandedId: string | null
  onFilter: (filter: Filter) => void
  onExpand: (date: string | null) => void
  onEditEntry: (date: string) => void
  onDeleteEntry: (date: string) => void
  onInsight: (date: string, insight: string) => void
  onGoReflect: () => void
  onConfirm: (request: ConfirmRequest) => void
}

export function RueckblickView({
  entries,
  areas,
  filter,
  expandedId,
  onFilter,
  onExpand,
  onEditEntry,
  onDeleteEntry,
  onInsight,
  onGoReflect,
  onConfirm,
}: Props) {
  const hasEntries = entries.length > 0
  const { rows, maxCount, hiebeTotal, hiebeDone, reflectionCount } = statsOf(entries, areas)

  // Archivierte Bereiche bleiben filterbar, solange sie noch in Einträgen vorkommen.
  const used = usedAreaIds(entries)
  const filterAreas = [
    ...activeAreas(areas),
    ...areas.filter((a) => a.archived && used.has(a.id)),
  ]

  const visible = sortedDesc(entries).filter(
    (entry) => filter === 'alle' || entry.reflections.some((r) => r.areaId === filter),
  )

  return (
    <div className="fade-in">
      <h2 className="view-title view-title--tight">Rückblick &amp; Muster</h2>

      {hasEntries && (
        <div className="stats">
          <div className="card stats__areas">
            <div className="eyebrow eyebrow--muted">Erfolge nach Lebensbereich</div>
            <div className="stats__rows">
              {rows.map((row) => (
                <div className="stats__row" key={row.areaId || 'ohne'}>
                  <div className="stats__label">{row.label}</div>
                  <div className="stats__bar">
                    <div
                      className="stats__fill"
                      style={{ width: `${Math.round((row.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <div className="stats__count">{row.count}</div>
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
              <div className="stats__sub">
                {reflectionCount} {reflectionCount === 1 ? 'Bereich' : 'Bereiche'} insgesamt
                vertieft
              </div>
            </div>
          </div>
        </div>
      )}

      {hasEntries ? (
        <>
          <div className="filters">
            <button
              type="button"
              className={filter === 'alle' ? 'chip chip--sm chip--active' : 'chip chip--sm'}
              aria-pressed={filter === 'alle'}
              onClick={() => onFilter('alle')}
            >
              Alle
            </button>
            {filterAreas.map((area) => (
              <button
                type="button"
                key={area.id}
                className={filter === area.id ? 'chip chip--sm chip--active' : 'chip chip--sm'}
                aria-pressed={filter === area.id}
                onClick={() => onFilter(area.id)}
              >
                {areaLabel(areas, area.id)}
              </button>
            ))}
          </div>

          <div className="entries">
            {visible.map((entry) => (
              <EntryCard
                key={entry.date}
                entry={entry}
                areas={areas}
                expanded={expandedId === entry.date}
                onToggle={() => onExpand(expandedId === entry.date ? null : entry.date)}
                onEdit={() => onEditEntry(entry.date)}
                onDelete={() => onDeleteEntry(entry.date)}
                onInsight={(insight) => onInsight(entry.date, insight)}
                onConfirm={onConfirm}
              />
            ))}
            {visible.length === 0 && (
              <p className="filters__empty">
                In diesem Lebensbereich gibt es noch keine Reflexion.
              </p>
            )}
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
