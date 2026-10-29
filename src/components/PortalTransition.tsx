import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Icon } from './Icon'
export function PortalTransition({ docking, quick, reduced, paper, skip }: { docking: boolean; quick: boolean; reduced: boolean; paper: RefObject<HTMLDivElement | null>; skip: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!docking || !paper.current) return
    const update = () => {
      const rect = paper.current?.getBoundingClientRect(), el = container.current
      if (!rect || !el) return
      el.style.setProperty('--paper-x', `${rect.left}px`)
      el.style.setProperty('--paper-y', `${rect.top}px`)
      el.style.setProperty('--paper-w', `${rect.width}px`)
      el.style.setProperty('--paper-h', `${rect.height}px`)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [docking, paper])
  return <div ref={container} className={`journey ${docking ? 'docking' : 'travelling'} ${reduced ? 'quiet-journey' : ''} ${quick ? 'quick-docking' : ''}`} role="status" aria-label="Entering your space">
    <div className="journey-portal" aria-hidden="true" />
    {!docking && <div className="journey-rings" aria-hidden="true"><span /><span /><span /></div>}
    <p>{docking ? 'A little space, just for you.' : 'Let the world grow quiet for a moment.'}</p>
    {!docking && <button className="text-button skip-button" onClick={skip}>Skip journey <Icon name="arrow" size={15} /></button>}
  </div>
}
