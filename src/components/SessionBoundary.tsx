import { Component, useEffect, useRef, useState } from 'react'
import App from '../App'
import { ErrorSpace, RecoveryWriting } from './ErrorSpace'

type BoundaryState = { failed: boolean; recoveryDraft: string; attempt: number }
export class SessionBoundary extends Component<object, BoundaryState> {
  state: BoundaryState = { failed: false, recoveryDraft: '', attempt: 0 }
  private draft = ''
  private rememberDraft = (value: string) => { this.draft = value }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() {
    // Announce recovery without uploading or persisting an error, stack, or writing.
    const heading = document.getElementById('error-space-title')
    heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true })
  }
  render() {
    if (this.state.failed) return <ErrorSpace kind="runtime" primary={<button className="error-primary" onClick={() => this.setState(state => ({ failed: false, recoveryDraft: this.draft, attempt: state.attempt + 1 }))}>{this.draft ? 'Restore my page' : 'Try again'}</button>} secondary={this.draft ? <span /> : <a className="error-secondary" href="/">Return to the stars</a>}><RecoveryWriting draft={this.draft} /></ErrorSpace>
    return <SessionHost key={this.state.attempt} initialDraft={this.state.recoveryDraft} rememberDraft={this.rememberDraft} />
  }
}

function SessionHost({ initialDraft, rememberDraft }: { initialDraft: string; rememberDraft: (value: string) => void }) {
  const [interruption, setInterruption] = useState<'offline' | 'runtime' | null>(null)
  const recoveryHeading = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const offline = () => setInterruption(current => current === 'runtime' ? current : 'offline')
    const online = () => setInterruption(current => current === 'offline' ? null : current)
    const failed = () => setInterruption('runtime')
    const error = (event: Event) => { if (event instanceof ErrorEvent || event.target instanceof HTMLScriptElement) failed() }
    window.addEventListener('offline', offline); window.addEventListener('online', online)
    window.addEventListener('error', error); window.addEventListener('unhandledrejection', failed)
    if (!navigator.onLine) offline()
    window.dispatchEvent(new Event('whisp:ready'))
    return () => { window.removeEventListener('offline', offline); window.removeEventListener('online', online); window.removeEventListener('error', error); window.removeEventListener('unhandledrejection', failed) }
  }, [])
  useEffect(() => {
    if (interruption) recoveryHeading.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    else document.querySelector<HTMLTextAreaElement>('textarea:not([readonly])')?.focus({ preventScroll: true })
  }, [interruption])
  return <>
    <div className={interruption ? 'app-under-recovery' : undefined} inert={Boolean(interruption)} aria-hidden={interruption ? true : undefined}><App initialDraft={initialDraft} onDraftChange={rememberDraft} interrupted={Boolean(interruption)} /></div>
    {interruption && <div ref={recoveryHeading} className="recovery-overlay" role="dialog" aria-modal="true" aria-labelledby="error-space-title"><ErrorSpace kind={interruption} primary={<button className="error-primary" onClick={() => setInterruption(null)}>{interruption === 'offline' ? 'Keep writing offline' : 'Return to my page'}</button>} secondary={<span />} /></div>}
  </>
}
