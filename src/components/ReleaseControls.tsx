import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export function ReleaseControls({ disabled, onRelease, swipeMode, setSwipeMode }: { disabled: boolean; onRelease: () => void; swipeMode: boolean; setSwipeMode: (value: boolean) => void }) {
  const [confirming, setConfirming] = useState(false)
  const timeout = useRef(0)
  useEffect(() => {
    if (disabled) setConfirming(false)
    return () => clearTimeout(timeout.current)
  }, [disabled])
  const release = () => {
    if (confirming) { clearTimeout(timeout.current); setConfirming(false); onRelease() }
    else { setConfirming(true); timeout.current = window.setTimeout(() => setConfirming(false), 5000) }
  }
  return <div className="release-actions">
    <button className="swipe-toggle text-button" disabled={disabled} aria-pressed={swipeMode} onClick={() => { setConfirming(false); setSwipeMode(!swipeMode) }}>{swipeMode ? 'Cancel swipe' : 'Or release with a swipe'}</button>
    <div className="release-button-wrap">
      <span className="confirm-caption" role="status">{confirming ? 'Ready? Tap once more to release.' : ''}</span>
      <button className={`release-button ${confirming ? 'confirming' : ''}`} disabled={disabled} onClick={release}><Icon name="wind" />{confirming ? 'Yes, let it go' : 'Let it go'}</button>
    </div>
  </div>
}
