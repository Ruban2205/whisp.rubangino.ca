import { useState, type ReactNode } from 'react'
import { errorPages, staticErrorKinds, type ErrorKind } from '../lib/errors'

export function ErrorSpace({ kind, embedded = false, primary, secondary, children }: { kind: ErrorKind; embedded?: boolean; primary?: ReactNode; secondary?: ReactNode; children?: ReactNode }) {
  const page = errorPages[kind], Container = embedded ? 'section' : 'main', Heading = embedded ? 'h2' : 'h1'
  return <Container className={`error-space error-space-${kind} ${embedded ? 'error-space-embedded' : ''}`} data-error-kind={kind} aria-labelledby="error-space-title">
    <div className="error-cosmos" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
    {!embedded && <a className="error-brand" href="/" aria-label="Whisp home">whisp<span aria-hidden="true">✧</span></a>}
    <div className="error-content">
      <div className="error-orbit" aria-hidden="true"><div className="error-orbit-ring" /><div className="error-orbit-ring error-orbit-cross" /><span className="error-orbit-core">✧</span><span className="error-orbit-star">✦</span><span className="error-orbit-dust" /></div>
      <p className="error-code">{page.code}</p><p className="error-eyebrow">{page.eyebrow}</p>
      <Heading id="error-space-title">{page.title}</Heading><p className="error-message">{page.message}</p>
      <div className="error-actions">{primary ?? <a className="error-primary" href="/">Return to the stars <span aria-hidden="true">↗</span></a>}{secondary ?? (page.retry && <a className="error-secondary" href="" data-error-retry>Try this page again</a>)}</div>
      {children}
    </div>
    {!embedded && <footer className="error-footer"><span>A LITTLE SPACE TO LET GO</span><p>By <a href="https://www.rubangino.ca/">Ruban Gino Singh</a> · <a href="https://labs.rubangino.ca/">Ruban AI Labs</a></p></footer>}
  </Container>
}

export function RecoveryWriting({ draft }: { draft: string }) {
  const [message, setMessage] = useState(''), [expanded, setExpanded] = useState(false)
  if (!draft) return null
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(draft); setMessage('Writing copied.')
    } catch { setExpanded(true); setMessage('Select and copy your writing below.') }
  }
  return <div className="recovery-writing">
    <p>The last available writing is still in this tab’s memory. Refreshing or closing loses it.</p>
    <button className="error-secondary" onClick={() => void copy()}>Copy my writing</button>
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary>View my writing</summary><textarea aria-label="Last available writing" readOnly value={draft} /></details><p role="status">{message}</p>
  </div>
}

export function ErrorGallery() {
  return <main className="public-info error-gallery"><a className="public-brand" href="/">whisp<span>✧</span></a><p className="error-eyebrow">A SEAMLESS LITTLE UNIVERSE</p><h1>Even a pause can feel like space.</h1><p>Preview Whisp’s error and connection screens. These previews don’t trigger a real outage.</p><div className="error-gallery-grid">{(Object.keys(errorPages) as ErrorKind[]).map(kind => <a key={kind} href={(staticErrorKinds as readonly string[]).includes(kind) ? `/${kind}.html` : `/errors/${kind}/`}><span>{errorPages[kind].code}</span><h2>{errorPages[kind].title}</h2><p>{errorPages[kind].message}</p></a>)}</div><a className="error-secondary" href="/">Back to Whisp</a></main>
}
