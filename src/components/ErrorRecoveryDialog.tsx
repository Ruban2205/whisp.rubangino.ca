import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ErrorSpace } from './ErrorSpace'
import type { RecoverableErrorKind } from '../lib/errors'

export function ErrorRecoveryDialog({ kind, retry, keepWriting }: { kind: RecoverableErrorKind; retry: () => void; keepWriting: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { element?.close(); document.querySelector<HTMLTextAreaElement>('textarea:not([readonly])')?.focus({ preventScroll: true }) }
  }, [])
  return createPortal(<dialog ref={dialog} className="error-recovery-dialog" aria-labelledby="error-space-title" onCancel={event => { event.preventDefault(); keepWriting() }} onClick={event => { if (event.target === event.currentTarget) keepWriting() }}>
    <button className="error-dialog-close" aria-label="Close recovery message" onClick={keepWriting}>×</button>
    <ErrorSpace kind={kind} embedded primary={<button className="error-primary" onClick={kind === 'release' ? keepWriting : retry}>{kind === 'release' ? 'Return to my writing' : 'Try again'}</button>} secondary={<button className="error-secondary" onClick={keepWriting}>{kind === 'audio' ? 'Continue quietly' : 'Keep writing'}</button>} />
  </dialog>, document.body)
}
