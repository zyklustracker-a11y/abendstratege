import { formatWeekRange, isoWeek, shiftWeek, weekKeyOf, weekStartOf } from '../lib/date'
import {
  activeAreas,
  areaLabel,
  entriesInWeek,
  entriesInYear,
  firstWeekKey,
  highlightsOfYear,
  quoteOf,
  sortedDesc,
  statsOf,
  usedAreaIds,
  weekBefore,
  weekSummary,
  yearRange,
  yearSummary,
  type Stats,
} from '../lib/selectors'
import type { Area, Entry, Filter, Period } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'
import { EntryCard } from './EntryCard'

interface Props {
  entries: Entry[]
  areas: Area[]
  filter: Filter
  period: Period
  weekKey: string
  year: number
  weeklyHighlights: Record<string, string>
  expandedId: string | null
  onFilter: (filter: Filter) => void
  onPeriod: (period: Period) => void
  onWeekKey: (weekKey: string) => void
  onYear: (year: number) => void
  onWeeklyHighlight: (weekKey: string, text: string) => void
  onExpand: (date: string | null) => void
  onEditEntry: (date: string) => void
  onDeleteEntry: (date: string) => void
  onInsight: (date: string, insight: string) => void
  onGoReflect: () => void
  onConfirm: (request: ConfirmRequest) => void
}

const PERIODS: ReadonlyArray<readonly [Period, string]> = [
  ['woche', 'Woche'],
  ['jahr', 'Jahr'],
  ['alles', 'Alles'],
]

export function RueckblickView({
  entries,
  areas,
  filter,
  period,
  weekKey,
  year,
  weeklyHighlights,
  expandedId,
  onFilter,
  onPeriod,
  onWeekKey,
  onYear,
  onWeeklyHighlight,
  onExpand,
  onEditEntry,
  onDeleteEntry,
  onInsight,
  onGoReflect,
  onConfirm,
}: Props) {
  const hasEntries = entries.length > 0

  // Zeitraum zuerst, Bereichsfilter darauf – beide gelten für Statistik und Liste.
  const inPeriod =
    period === 'woche'
      ? entriesInWeek(entries, weekKey)
      : period === 'jahr'
        ? entriesInYear(entries, year)
        : entries

  const visible = sortedDesc(inPeriod).filter(
    (entry) => filter === 'alle' || entry.reflections.some((r) => r.areaId === filter),
  )

  // Archivierte Bereiche bleiben filterbar, solange sie noch in Einträgen vorkommen.
  const used = usedAreaIds(entries)
  const filterAreas = [
    ...activeAreas(areas),
    ...areas.filter((a) => a.archived && used.has(a.id)),
  ]

  return (
    <div className="fade-in">
      <h2 className="view-title view-title--tight">Rückblick &amp; Muster</h2>

      {hasEntries && (
        <>
          <div className="filters filters--periods">
            {PERIODS.map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={period === key ? 'chip chip--sm chip--active' : 'chip chip--sm'}
                aria-pressed={period === key}
                onClick={() => onPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {period === 'woche' && (
            <WeekNav entries={entries} weekKey={weekKey} onWeekKey={onWeekKey} />
          )}
          {period === 'jahr' && <YearNav entries={entries} year={year} onYear={onYear} />}
        </>
      )}

      {hasEntries && period === 'alles' && <AllStats entries={entries} areas={areas} />}

      {hasEntries && period === 'woche' && (
        <WeekReview
          entries={entries}
          areas={areas}
          weekKey={weekKey}
          highlight={weeklyHighlights[weekKey] ?? ''}
          onWeeklyHighlight={onWeeklyHighlight}
        />
      )}

      {hasEntries && period === 'jahr' && (
        <YearReview
          entries={entries}
          areas={areas}
          year={year}
          weeklyHighlights={weeklyHighlights}
        />
      )}

      {!hasEntries ? (
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
      ) : (
        // Im leeren Zeitraum bleiben Filter und Liste weg: Der Leerzustand der
        // Karte darüber sagt es schon, zweimal wäre es ein Vorwurf.
        inPeriod.length > 0 && (
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
                {period === 'alles'
                  ? 'In diesem Lebensbereich gibt es noch keine Reflexion.'
                  : 'In diesem Lebensbereich gibt es in diesem Zeitraum keine Reflexion.'}
              </p>
            )}
          </div>
        </>
        )
      )}
    </div>
  )
}

/** Blättern durch die Wochen – nicht vor den ersten Eintrag, nicht in die Zukunft. */
function WeekNav({
  entries,
  weekKey,
  onWeekKey,
}: {
  entries: Entry[]
  weekKey: string
  onWeekKey: (key: string) => void
}) {
  const current = weekKeyOf()
  const first = firstWeekKey(entries)
  const { week } = isoWeek(weekStartOf(weekKey))

  return (
    <PeriodNav
      title={weekKey === current ? 'Diese Woche' : `KW ${week}`}
      sub={formatWeekRange(weekKey)}
      backLabel="Eine Woche zurück"
      forwardLabel="Eine Woche vor"
      canBack={first !== null && weekBefore(first, weekKey)}
      canForward={weekBefore(weekKey, current)}
      onBack={() => onWeekKey(shiftWeek(weekKey, -1))}
      onForward={() => onWeekKey(shiftWeek(weekKey, 1))}
    />
  )
}

function YearNav({
  entries,
  year,
  onYear,
}: {
  entries: Entry[]
  year: number
  onYear: (year: number) => void
}) {
  const { first, last } = yearRange(entries)

  return (
    <PeriodNav
      title={String(year)}
      sub={year === last ? 'Dieses Jahr' : ''}
      backLabel="Ein Jahr zurück"
      forwardLabel="Ein Jahr vor"
      canBack={year > first}
      canForward={year < last}
      onBack={() => onYear(year - 1)}
      onForward={() => onYear(year + 1)}
    />
  )
}

interface NavProps {
  title: string
  sub: string
  backLabel: string
  forwardLabel: string
  canBack: boolean
  canForward: boolean
  onBack: () => void
  onForward: () => void
}

function PeriodNav({
  title,
  sub,
  backLabel,
  forwardLabel,
  canBack,
  canForward,
  onBack,
  onForward,
}: NavProps) {
  return (
    <div className="periodnav">
      <button
        type="button"
        className="periodnav__step"
        aria-label={backLabel}
        title={backLabel}
        disabled={!canBack}
        onClick={onBack}
      >
        ‹
      </button>
      <div className="periodnav__label">
        <span className="periodnav__title">{title}</span>
        {sub && <span className="periodnav__sub">{sub}</span>}
      </div>
      <button
        type="button"
        className="periodnav__step"
        aria-label={forwardLabel}
        title={forwardLabel}
        disabled={!canForward}
        onClick={onForward}
      >
        ›
      </button>
    </div>
  )
}

/** Erfolge nach Bereich als Balkenreihe – in allen drei Zeiträumen dieselbe Form. */
function AreaRows({ stats }: { stats: Stats }) {
  return (
    <div className="stats__rows">
      {stats.rows.map((row) => (
        <div className="stats__row" key={row.areaId || 'ohne'}>
          <div className="stats__label">{row.label}</div>
          <div className="stats__bar">
            <div
              className="stats__fill"
              style={{ width: `${Math.round((row.count / stats.maxCount) * 100)}%` }}
            />
          </div>
          <div className="stats__count">{row.count}</div>
        </div>
      ))}
    </div>
  )
}

/** Die bisherige Gesamtstatistik, unverändert. */
function AllStats({ entries, areas }: { entries: Entry[]; areas: Area[] }) {
  const stats = statsOf(entries, areas)
  const quote = quoteOf(stats)

  return (
    <div className="stats">
      <div className="card stats__areas">
        <div className="eyebrow eyebrow--muted">Erfolge nach Lebensbereich</div>
        <AreaRows stats={stats} />
      </div>
      <div className="stats__side">
        <div className="card stats__card stats__card--grow">
          <div className="eyebrow eyebrow--muted">Umsetzungsquote</div>
          <div className="stats__value">{quote === null ? '–' : `${quote} %`}</div>
          <div className="stats__sub">
            {stats.hiebeDone} von {stats.hiebeTotal} Hieben umgesetzt
          </div>
        </div>
        <div className="card stats__card">
          <div className="eyebrow eyebrow--muted">Reflexionen</div>
          <div className="stats__value stats__value--plain">{entries.length}</div>
          <div className="stats__sub">
            {stats.reflectionCount} {stats.reflectionCount === 1 ? 'Bereich' : 'Bereiche'} insgesamt
            vertieft
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekReview({
  entries,
  areas,
  weekKey,
  highlight,
  onWeeklyHighlight,
}: {
  entries: Entry[]
  areas: Area[]
  weekKey: string
  highlight: string
  onWeeklyHighlight: (weekKey: string, text: string) => void
}) {
  const { days, stats, strongest, silent } = weekSummary(entries, areas, weekKey)
  const quote = quoteOf(stats)

  return (
    <div className="review">
      {days === 0 ? (
        <div className="empty-state empty-state--soft">
          <div className="empty-state__title">In dieser Woche kein Abend.</div>
          <p className="empty-state__text empty-state__text--narrow">
            Das kommt vor. Der Rückblick zählt keine Versäumnisse – er zeigt, worauf du aufbauen
            kannst.
          </p>
        </div>
      ) : (
        <div className="card review__card">
          <div className="eyebrow eyebrow--muted">Die Woche in Zahlen</div>
          <div className="review__facts">
            <div className="review__fact">
              <div className="review__value">
                {days} <span className="review__of">von 7</span>
              </div>
              <div className="review__caption">
                {days === 1 ? 'Abend reflektiert' : 'Abenden reflektiert'}
              </div>
            </div>
            <div className="review__fact">
              <div className="review__value">{quote === null ? '–' : `${quote} %`}</div>
              <div className="review__caption">
                {stats.hiebeDone} von {stats.hiebeTotal} Hieben umgesetzt
              </div>
            </div>
            <div className="review__fact">
              <div className="review__value review__value--plain">{stats.reflectionCount}</div>
              <div className="review__caption">
                {stats.reflectionCount === 1 ? 'Durchlauf' : 'Durchläufe'} vertieft
              </div>
            </div>
          </div>

          <div className="review__lines">
            {strongest && (
              <p className="review__line">
                Am stärksten: <strong>{strongest.label}</strong> mit {strongest.count}{' '}
                {strongest.count === 1 ? 'Erfolg' : 'Erfolgen'}.
              </p>
            )}
            {silent.length > 0 && (
              <p className="review__line review__line--muted">
                Ohne Eintrag: {silent.map((row) => row.label).join(', ')}.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="card review__card">
        <label className="eyebrow eyebrow--muted" htmlFor={`highlight-${weekKey}`}>
          Das Highlight der Woche
        </label>
        <p className="review__question">
          Was war diese Woche der eine Moment, auf dem du aufbaust?
        </p>
        <textarea
          id={`highlight-${weekKey}`}
          className="level-textarea review__highlight"
          rows={2}
          value={highlight}
          placeholder="Ein Satz genügt."
          onChange={(e) => onWeeklyHighlight(weekKey, e.target.value)}
        />
      </div>
    </div>
  )
}

function YearReview({
  entries,
  areas,
  year,
  weeklyHighlights,
}: {
  entries: Entry[]
  areas: Area[]
  year: number
  weeklyHighlights: Record<string, string>
}) {
  const { entries: inYear, stats, longestStreak, months, maxMonth } = yearSummary(
    entries,
    areas,
    year,
  )
  const quote = quoteOf(stats)
  const highlights = highlightsOfYear(weeklyHighlights, year)

  if (!inYear.length) {
    return (
      <div className="review">
        <div className="empty-state empty-state--soft">
          <div className="empty-state__title">Aus {year} liegt kein Abend vor.</div>
          <p className="empty-state__text empty-state__text--narrow">
            Blättere in ein anderes Jahr – oder halte den heutigen Abend fest.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="review">
      <div className="card review__card">
        <div className="eyebrow eyebrow--muted">{year} im Ganzen</div>
        <div className="review__facts">
          <div className="review__fact">
            <div className="review__value review__value--plain">{inYear.length}</div>
            <div className="review__caption">{inYear.length === 1 ? 'Abend' : 'Abende'}</div>
          </div>
          <div className="review__fact">
            <div className="review__value review__value--plain">{stats.reflectionCount}</div>
            <div className="review__caption">
              {stats.reflectionCount === 1 ? 'Durchlauf' : 'Durchläufe'}
            </div>
          </div>
          <div className="review__fact">
            <div className="review__value">{longestStreak}</div>
            <div className="review__caption">
              {longestStreak === 1 ? 'Tag in Folge' : 'Tage in Folge'}
            </div>
          </div>
          <div className="review__fact">
            <div className="review__value">{quote === null ? '–' : `${quote} %`}</div>
            <div className="review__caption">
              {stats.hiebeDone} von {stats.hiebeTotal} Hieben umgesetzt
            </div>
          </div>
        </div>
      </div>

      <div className="card review__card">
        <div className="eyebrow eyebrow--muted">Über das Jahr verteilt</div>
        <div className="stats__rows">
          {months.map((month) => (
            <div className="stats__row" key={month.month}>
              <div className="stats__label stats__label--month">{month.label}</div>
              <div className="stats__bar">
                <div
                  className="stats__fill"
                  style={{ width: `${Math.round((month.count / maxMonth) * 100)}%` }}
                />
              </div>
              <div className="stats__count">{month.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card review__card">
        <div className="eyebrow eyebrow--muted">Erfolge nach Lebensbereich</div>
        <AreaRows stats={stats} />
      </div>

      <div className="card review__card">
        <div className="eyebrow eyebrow--muted">Die Highlights der Wochen</div>
        {highlights.length ? (
          <div className="review__highlights">
            {highlights.map(({ key, text }) => (
              <div className="review__highlight-item" key={key}>
                <div className="review__highlight-week">
                  KW {isoWeek(weekStartOf(key)).week} · {formatWeekRange(key)}
                </div>
                <p className="review__highlight-text">{text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="review__line review__line--muted">
            Noch kein Highlight festgehalten. Im Zeitraum „Woche“ steht dafür ein Feld.
          </p>
        )}
      </div>
    </div>
  )
}
