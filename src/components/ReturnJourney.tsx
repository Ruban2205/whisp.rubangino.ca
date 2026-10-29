import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Icon } from './Icon'
export function ReturnJourney({ revealingHome, reduced, paper, skip }: { revealingHome: boolean; reduced: boolean; paper: RefObject<HTMLDivElement | null>; skip: () => void }) {
  const container = useRef<HTMLDivElement>(null), skipButton = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    const rect = paper.current?.getBoundingClientRect(), el = container.current
    if (rect && el) {
      el.style.setProperty('--paper-x', `${rect.left}px`); el.style.setProperty('--paper-y', `${rect.top}px`)
      el.style.setProperty('--paper-w', `${rect.width}px`); el.style.setProperty('--paper-h', `${rect.height}px`)
    }
    skipButton.current?.focus({ preventScroll: true })
  }, [paper])
  return <div ref={container} className={`journey returning-journey ${revealingHome ? 'receding' : 'lifting'} ${reduced ? 'quiet-return' : ''}`} role="status" aria-label="Returning to the stars">
    <div className="return-glow" aria-hidden="true" />
    <p>Back to your little corner of the universe.</p>
    <button ref={skipButton} className="text-button skip-button" onClick={skip}>Skip return <Icon name="arrow" size={15} /></button>
  </div>
}
