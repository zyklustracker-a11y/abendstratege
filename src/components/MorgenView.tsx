import { useState } from 'react'
import { formatShort } from '../lib/date'
import { hiebMeta, sortedDesc } from '../lib/selectors'
import type { Entry, Hieb } from '../lib/types'
import type { ConfirmRequest } from './ConfirmDialog'

interface Props {
  entries: Entry[]
  onToggle: (date: string, hiebId: string) => void
  onUpdate: (date: string, hiebId: string, patch: Partial<Hieb>) => void
  onRemove: (date: string, hiebId: string) => void
  onAdd: (date: string, text: string) => void
  onGoReflect: () => void
  onConfirm: (request: ConfirmRequest) => void
}

/** Die Tagesliste: Hiebe aus der Abendreflexion plus spontan ergänzte To-dos. */
export function MorgenView({
  entries,
  onToggle,
  onUpdate,
  onRemove,
  onAdd,
  onGoReflect,
  onConfirm,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [todo, setTodo] = useState('')
  const latest = sortedDesc(entries)[0]
  const hiebe = latest?.hiebe ?? []
  const done = hiebe.filter((h) => h.done).length

  if (!latest) {
    return (
      <div className="fade-in">
        <h2 className="view-title">Morgen-Blick</h2>
        <div className="empty-state morgen__empty">
          <div className="empty-state__title">Noch keine Hiebe formuliert.</div>
          <p className="empty-state__text">
            Deine erste Abendreflexion legt die Hiebe für den nächsten Tag fest.
          </p>
          <button type="button" className="btn-outline" onClick={onGoReflect}>
            Heute Abend reflektieren
          </button>
        </div>
      </div>
    )
  }

  const addTodo = () => {
    if (!todo.trim()) return
    onAdd(latest.date, todo)
    setTodo('')
  }

  return (
    <div className="fade-in">
      <h2 className="view-title">Morgen-Blick</h2>
      <p className="morgen__lead">
        Deine Hiebe aus der Reflexion vom {formatShort(latest.date)} – ergänzt um das, was heute
        sonst noch ansteht.
      </p>

      <div className="morgen__list">
        {hiebe.map((hieb) => {
          const meta = hiebMeta(hieb)
          const fromReflection = hieb.source === 'reflection'
          const isEditing = editing === hieb.id

          return (
            <div className="morgen__item" key={hieb.id}>
              {isEditing ? (
                <div className="morgen__body morgen__edit">
                  <input
                    type="text"
                    className="text-input"
                    value={hieb.text}
                    autoFocus
                    aria-label="Text bearbeiten"
                    onChange={(e) => onUpdate(latest.date, hieb.id, { text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') setEditing(null)
                    }}
                  />
                  <div className="hieb__meta hieb__meta--flush">
                    <select
                      className="mini-select"
                      value={hieb.slot}
                      aria-label="Tagesabschnitt"
                      onChange={(e) => onUpdate(latest.date, hieb.id, { slot: e.target.value })}
                    >
                      <option value="">Tagesabschnitt</option>
                      <option value="Morgens">Morgens</option>
                      <option value="Mittags">Mittags</option>
                      <option value="Abends">Abends</option>
                    </select>
                    <input
                      type="time"
                      className="time-input"
                      value={hieb.time}
                      aria-label="Uhrzeit"
                      onChange={(e) => onUpdate(latest.date, hieb.id, { time: e.target.value })}
                    />
                    <button type="button" className="btn-text" onClick={() => setEditing(null)}>
                      Fertig
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="morgen__toggle"
                  aria-pressed={hieb.done}
                  onClick={() => onToggle(latest.date, hieb.id)}
                >
                  <span
                    className={hieb.done ? 'morgen__check morgen__check--done' : 'morgen__check'}
                    aria-hidden="true"
                  >
                    {hieb.done ? '✓' : ''}
                  </span>
                  <span className="morgen__body">
                    <span className={hieb.done ? 'morgen__text morgen__text--done' : 'morgen__text'}>
                      {hieb.text}
                    </span>
                    <span className="morgen__tags">
                      {fromReflection && (
                        <span className="tag">
                          <span className="tag__mark" aria-hidden="true">
                            ◆
                          </span>
                          Aus deiner Abendreflexion
                        </span>
                      )}
                      {meta && <span className="morgen__meta">{meta}</span>}
                    </span>
                  </span>
                </button>
              )}

              <div className="morgen__actions">
                <button
                  type="button"
                  className="icon-btn icon-btn--quiet"
                  title="Bearbeiten"
                  aria-label={`„${hieb.text}“ bearbeiten`}
                  onClick={() => setEditing(isEditing ? null : hieb.id)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--quiet"
                  title="Löschen"
                  aria-label={`„${hieb.text}“ löschen`}
                  onClick={() => {
                    if (!fromReflection) {
                      onRemove(latest.date, hieb.id)
                      return
                    }
                    onConfirm({
                      title: 'Hieb löschen?',
                      text: `„${hieb.text}“ stammt aus deiner Abendreflexion. Gelöscht verschwindet er auch aus dem Rückblick und aus der Umsetzungsquote.`,
                      confirmLabel: 'Löschen',
                      onConfirm: () => onRemove(latest.date, hieb.id),
                    })
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="morgen__add">
        <input
          type="text"
          className="text-input row__input"
          value={todo}
          placeholder="Was steht heute sonst noch an?"
          aria-label="Zusätzliches To-do"
          onChange={(e) => setTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTodo()
          }}
        />
        <button type="button" className="btn-outline" onClick={addTodo}>
          Hinzufügen
        </button>
      </div>

      {hiebe.length > 0 && (
        <p className="morgen__progress">
          {done} von {hiebe.length} umgesetzt
        </p>
      )}
    </div>
  )
}
