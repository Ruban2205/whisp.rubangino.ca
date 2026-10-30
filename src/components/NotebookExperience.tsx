import { useEffect, useRef, useState } from 'react'
import type { Dispatch, RefObject } from 'react'
import type { VoiceWriting } from '../hooks/useVoiceWriting'
import type { CacheClearStatus } from '../lib/speechCache'
import type { SupportiveQuote } from '../lib/quotes'
import { VoiceControls } from './VoiceControls'
import type { RitualEvent, RitualState } from '../lib/state'
import type { BreathDetection } from '../hooks/useBreathDetection'
import type { BreathSensitivity } from '../lib/breath'
import { InkRelease } from './InkRelease'
import { ReleaseControls } from './ReleaseControls'
import { Icon } from './Icon'

export function NotebookExperience({ state, dispatch, reduced, mic, toggleMic, sensitivity, setSensitivity, voice, startVoice, finishVoice, quote, paperRef, playInk, cacheStatus }: { state: RitualState; dispatch: Dispatch<RitualEvent>; reduced: boolean; mic: BreathDetection; toggleMic: () => void; sensitivity: BreathSensitivity; setSensitivity: (value: BreathSensitivity) => void; voice: VoiceWriting; startVoice: () => void; finishVoice: () => void; quote: SupportiveQuote | null; paperRef: RefObject<HTMLDivElement | null>; playInk: () => void; cacheStatus: CacheClearStatus | 'idle' | 'clearing' }) {
  const editor = useRef<HTMLTextAreaElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [swipeMode, setSwipeMode] = useState(false)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [seconds, setSeconds] = useState(20)
  const [error, setError] = useState('')
  const swipeStart = useRef<{ x: number; y: number; id: number } | null>(null)
  const release = () => { mic.stop(); setSwipeMode(false); setError(''); dispatch({ type: 'RELEASE' }) }
  const isWriting = state.stage === 'writing'
  const hasText = Boolean(state.text.trim())
  const breathInstruction = sensitivity === 'gentle'
    ? 'When you’re ready, take a slow breath in, then breathe out gently toward your screen.'
    : 'When you’re ready, take a deep breath in, then blow toward your screen.'
  const goingHome = state.stage === 'returning'
  const showingCompletion = state.stage === 'complete' || (goingHome && Boolean(quote))
  useEffect(() => {
    if (isWriting) {
      const timer = window.setTimeout(() => editor.current?.focus({ preventScroll: true }), 180)
      return () => clearTimeout(timer)
    }
    if (state.stage === 'complete') {
      heading.current?.focus({ preventScroll: true })
      editor.current?.parentElement?.style.setProperty('--paper-scroll', '0px')
    }
  }, [isWriting, state.stage])
  useEffect(() => {
    if (!swipeMode) return
    mic.stop()
    const timer = window.setTimeout(() => { setSwipeMode(false); setSwipeDistance(0) }, 15000)
    return () => clearTimeout(timer)
  }, [swipeMode, mic.stop])
  useEffect(() => {
    if (state.stage !== 'complete') return
    setSeconds(20)
    const end = Date.now() + 20000
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setSeconds(remaining)
      if (!remaining) { dispatch({ type: 'EXPIRE' }); clearInterval(interval) }
    }, 250)
    return () => clearInterval(interval)
  }, [state.stage, dispatch])
  const finishSwipe = (event: React.PointerEvent) => {
    const start = swipeStart.current
    swipeStart.current = null; setSwipeDistance(0)
    if (!start || start.id !== event.pointerId) return
    if (event.clientX - start.x >= Math.min(150, event.currentTarget.clientWidth * 0.4) && Math.abs(event.clientY - start.y) < 80) release()
  }
  return <section className={`notebook-experience ${state.stage}`} aria-label="Your private writing space" aria-busy={state.stage === 'entering' || goingHome}>
    <div className="notebook-intro">
      <p className="eyebrow">NO NEED TO MAKE SENSE OF IT ALL</p>
      <h1>Let the page <em>hold it for you.</em></h1>
      <p className="notebook-guide" id="ritual-guide">{voice.busy && voice.status !== 'listening' ? 'Your words are being prepared. You can keep writing here while you wait.' : <>{voice.status === 'listening' ? 'Speak at your own pace. Choose Finish voice typing when you’re done.' : 'Write or speak what’s on your mind.'} {breathInstruction}</>}</p>
      <p className="guide-detail">{sensitivity === 'gentle' ? 'A soft, steady breath is enough in Gentle mode.' : 'Let it out at your own pace.'} You can also choose Let it go.</p>
    </div>
    <div ref={paperRef} className={`notebook-paper ${state.stage === 'releasing' ? 'paper-releasing' : ''}`}>
      <div className="paper-topline" aria-hidden="true"><span>YOUR THOUGHTS, UNFILTERED.</span><Icon name="spark" size={16} /><span>JUST THIS MOMENT.</span></div>
      <div className="page-magic" aria-hidden="true" />
      {state.stage === 'releasing' && <div className="page-breeze" aria-hidden="true"><span /><span /><span /></div>}
      <div className="paper-margin" aria-hidden="true" />
      <div className="writing-area">
        <textarea key={state.stage === 'complete' ? 'clean-page' : 'draft'} ref={editor} value={state.text} onChange={event => { dispatch({ type: 'EDIT', text: event.target.value }); if (event.target.value.length > state.text.length) playInk() }} onScroll={event => event.currentTarget.parentElement?.style.setProperty('--paper-scroll', `${-event.currentTarget.scrollTop}px`)} placeholder="What's on your mind?" aria-label="What's on your mind?" aria-describedby="ritual-guide draft-note" aria-hidden={state.stage === 'complete'} readOnly={!isWriting || swipeMode} tabIndex={isWriting && !swipeMode ? 0 : -1} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" data-gramm="false" data-enable-grammarly="false" className="handwriting-editor" />
        {isWriting && !state.text && <span className="editor-hint" aria-hidden="true">There’s no right way to begin.</span>}
      </div>
      <div className="paper-bottomline"><span id="draft-note">Only here. Only for now. Refreshing loses your words.</span><span aria-hidden="true">01</span></div>
      {swipeMode && isWriting && <div className="swipe-surface" role="group" aria-label="Swipe right to release. Or use the Let it go button." onPointerDown={event => { if (event.isPrimary) { event.currentTarget.setPointerCapture(event.pointerId); swipeStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId } } }} onPointerMove={event => { const start = swipeStart.current; if (start && start.id === event.pointerId) setSwipeDistance(Math.max(0, Math.min(150, event.clientX - start.x))) }} onPointerUp={finishSwipe} onPointerCancel={() => { swipeStart.current = null; setSwipeDistance(0) }}>
        <Icon name="wind" size={32} /><p>One slow swipe to the right.</p><div className="swipe-track"><span style={{ transform: `translateX(${swipeDistance}px)` }}><Icon name="arrow" /></span></div><button className="text-button" onClick={() => setSwipeMode(false)}>Keep writing</button>
      </div>}
      {showingCompletion && <div className="completion">
        <div className="completion-symbol"><Icon name="wind" size={32} /></div>
        <p className="eyebrow">A LITTLE LIGHT FOR YOUR NEXT MOMENT</p>
        <h2 ref={heading} tabIndex={-1}>It’s okay to <em>let go.</em></h2>
        <blockquote className="supportive-quote" data-theme={quote?.theme}>{quote?.text || 'You are allowed to begin again, exactly as you are.'}</blockquote>
        <button disabled={goingHome} className="quiet-button completion-again" onClick={() => dispatch({ type: 'AGAIN' })}>Begin again <Icon name="arrow" size={17} /></button>
        <p className="cache-release-note" role="status">{cacheStatus === 'cleared' ? 'Speech model cache cleared automatically.' : cacheStatus === 'clearing' ? 'Clearing the speech model cache…' : cacheStatus === 'failed' ? 'The model cache could not be cleared. You can retry in Help.' : cacheStatus === 'unavailable' ? 'This browser has no app speech-model cache.' : ''}</p>
        <div className="undo-space">{state.released !== null ? <button className="text-button undo-button" onClick={() => dispatch({ type: 'UNDO' })}>Bring it back <span aria-hidden="true">· {seconds}s</span></button> : <span className="undo-expired">The page is yours again.</span>}</div>
        <button disabled={goingHome} className="text-button completion-home" onClick={() => dispatch({ type: 'HOME' })}>Return to the stars</button>
      </div>}
    </div>
    {isWriting && <VoiceControls voice={voice} start={startVoice} finish={finishVoice} />}
    <div className="notebook-controls">
      {isWriting && <>
        <div className={`microphone ${mic.active ? 'listening' : ''}`}>
          <button className="mic-button" disabled={voice.busy} aria-pressed={mic.active} onClick={() => { setSwipeMode(false); toggleMic() }}><span className="mic-icon"><Icon name="mic" size={19} /></span>{mic.active ? 'Stop listening' : 'Use my breath'}</button>
          <p className="mic-description">Your microphone listens for your breath.<br />Audio stays on your device.</p>
        </div>
        <ReleaseControls disabled={!hasText || voice.busy} onRelease={release} swipeMode={swipeMode} setSwipeMode={setSwipeMode} />
      </>}
      {state.stage === 'releasing' && <p className="release-message" role="status">A breath. A little space. Letting go…</p>}
      {state.stage === 'complete' && <p className="release-message">Nothing to do. Nowhere to be.</p>}
    </div>
    <div className="mic-status" role="status" aria-label="Microphone status" aria-live="polite">
      {mic.active && <span className={`listening-dot ${mic.status}`} aria-hidden="true" />}
      {mic.message || error}
      {mic.status === 'ready' && <span className="input-level-track inline-input" role="meter" aria-label="Microphone input level" aria-valuenow={Math.round(mic.level * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${mic.level})` }} /></span>}
      {mic.status === 'ready' && <span className="breath-meter" role="progressbar" aria-label="Sustained breath" aria-valuenow={Math.round(mic.progress * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${mic.progress})` }} /></span>}
    </div>
    {isWriting && mic.active && !voice.busy && <details className="breath-troubleshooting"><summary>Microphone not responding?</summary><div className="breath-feedback">
      <label>Sensitivity <select aria-label="Breath sensitivity" value={sensitivity} onChange={event => setSensitivity(event.target.value as BreathSensitivity)}><option value="normal">Normal</option><option value="gentle">Gentle breath</option></select></label>
      <button className="text-button" disabled={mic.status === 'requesting' || mic.status === 'waiting'} onClick={() => void mic.start()}>Recalibrate</button>
      <p>Follow the breathing guide above. Choose Gentle breath for a softer response. If the input meter stays still, check microphone access.</p>
    </div></details>}
    {state.stage === 'releasing' && editor.current && <InkRelease editor={editor.current} reduced={reduced} onDone={() => dispatch({ type: 'RELEASE_DONE' })} onError={() => { dispatch({ type: 'RELEASE_FAILED' }); setError('The breeze paused. Your words are still here. Please try again.') }} />}
  </section>
}
