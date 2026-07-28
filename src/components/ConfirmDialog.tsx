import { useEffect, useRef } from 'react'

export interface ConfirmRequest {
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
}

interface Props {
  request: ConfirmRequest | null
  onClose: () => void
}

/** Rückfrage vor unwiderruflichen Schritten – bewusst nur dort. */
export function ConfirmDialog({ request, onClose }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!request) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [request, onClose])

  if (!request) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="dialog__title" id="dialog-title">
          {request.title}
        </h3>
        <p className="dialog__text">{request.text}</p>
        <div className="dialog__actions">
          <button type="button" className="btn-ghost" ref={cancelRef} onClick={onClose}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              request.onConfirm()
              onClose()
            }}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
