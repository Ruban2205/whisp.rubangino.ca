import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { initialState, ritualReducer, type RitualEvent } from './lib/state'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useAmbience } from './hooks/useAmbience'
import { useVoiceWriting } from './hooks/useVoiceWriting'
import { StarfieldScene } from './components/StarfieldScene'
import { NotebookExperience } from './components/NotebookExperience'
import { PrivacyInfo } from './components/PrivacyInfo'
import { ReturnJourney } from './components/ReturnJourney'
import { clearSpeechModelCache, type CacheClearStatus } from './lib/speechCache'
import { PortalTransition } from './components/PortalTransition'
import { Icon } from './components/Icon'
import { useBreathDetection } from './hooks/useBreathDetection'
import type { BreathSensitivity } from './lib/breath'
import { JOURNEY_MS } from './lib/soundscape'
import { QuoteDeck, type SupportiveQuote } from './lib/quotes'

export default function App() {
  const [state, dispatch] = useReducer(ritualReducer, initialState)
  const [privacy, setPrivacy] = useState(false)
  const [docking, setDocking] = useState(false)
  const [quickDock, setQuickDock] = useState(false)
  const [homeVisible, setHomeVisible] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<CacheClearStatus | 'idle' | 'clearing'>('idle')
  const [quote, setQuote] = useState<SupportiveQuote | null>(null)
  const reduced = useReducedMotion()
  const [micWanted, setMicWanted] = useState(true)
  const [sensitivity, setSensitivity] = useState<BreathSensitivity>('normal')
  const deck = useRef(new QuoteDeck())
  const paper = useRef<HTMLDivElement>(null)
  const enter = useRef<HTMLButtonElement>(null)
  const skipTimer = useRef(0)
  const actions = useRef({ release: () => {}, restartMic: () => {}, home: () => {} })
  const ritualDispatch = useCallback((event: RitualEvent) => {
    if (event.type === 'HOME') { actions.current.home(); return }
    if (event.type === 'HOME_DONE') setQuote(null)
    if (event.type === 'RELEASE') { actions.current.release(); return }
    if (event.type === 'AGAIN' || event.type === 'UNDO') { setQuote(null); actions.current.restartMic() }
    dispatch(event)
  }, [])
  const voice = useVoiceWriting(text => dispatch({ type: 'APPEND_SPEECH', text }))
  const mic = useBreathDetection(() => ritualDispatch({ type: 'RELEASE' }), {
    calibrate: state.stage === 'writing', armed: state.stage === 'writing' && Boolean(state.text.trim()) && !voice.busy, sensitivity,
  })
  const sound = useAmbience(state.stage === 'entering' && !docking ? 'journey' : state.stage === 'returning' ? 'return' : state.stage === 'landing' ? 'quiet' : 'notebook', mic.active, mic.progress > 0.04, voice.busy)
  actions.current = {
    release: () => {
      if (state.stage !== 'writing' || !state.text.trim() || voice.busy) return
      voice.reset(); setCacheStatus('idle'); setQuote(deck.current.pick(state.text)); mic.stop(); dispatch({ type: 'RELEASE' })
    },
    restartMic: () => { if (micWanted) void mic.start() },
    home: () => {
      if (state.stage !== 'complete' && !(state.stage === 'writing' && !state.text && !voice.busy)) return
      voice.reset(); mic.stop(); setHomeVisible(false); dispatch({ type: 'HOME' })
    },
  }
  const enterSpace = () => {
    if (state.stage !== 'landing') return
    setDocking(reduced); setQuickDock(false)
    void sound.start('journey')
    if (micWanted) void mic.start()
    dispatch({ type: 'ENTER' })
  }
  const toggleMic = () => {
    if (mic.active) { setMicWanted(false); mic.stop() }
    else { setMicWanted(true); void mic.start() }
  }
  const startVoice = () => { mic.stop(); void voice.start() }
  const finishVoice = () => { voice.finish(); if (micWanted) void mic.start() }
  const skipJourney = () => {
    if (docking) return
    setDocking(true); setQuickDock(true)
    skipTimer.current = window.setTimeout(() => dispatch({ type: 'ARRIVE' }), reduced ? 120 : 500)
  }
  const showNotebook = state.stage === 'returning' ? !homeVisible : state.stage !== 'landing' && (state.stage !== 'entering' || docking)
  useEffect(() => {
    if (state.stage !== 'entering') return
    const reveal = window.setTimeout(() => setDocking(true), reduced ? 0 : JOURNEY_MS - 1600)
    const arrive = window.setTimeout(() => dispatch({ type: 'ARRIVE' }), reduced ? 120 : JOURNEY_MS)
    return () => { clearTimeout(reveal); clearTimeout(arrive); clearTimeout(skipTimer.current) }
  }, [state.stage, reduced])
  useEffect(() => {
    if (!state.text || (state.stage !== 'writing' && state.stage !== 'releasing')) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state.text, state.stage])
  useEffect(() => {
    if (state.stage !== 'returning') return
    const reveal = window.setTimeout(() => setHomeVisible(true), reduced ? 0 : 1250)
    const done = window.setTimeout(() => ritualDispatch({ type: 'HOME_DONE' }), reduced ? 180 : 3600)
    return () => { clearTimeout(reveal); clearTimeout(done) }
  }, [state.stage, reduced, ritualDispatch])
  useEffect(() => {
    if (state.stage !== 'complete' && state.stage !== 'returning') return
    let active = true
    setCacheStatus('clearing')
    void clearSpeechModelCache().then(result => { if (active) setCacheStatus(result) })
    return () => { active = false }
  }, [state.stage])
  useEffect(() => { if (state.stage === 'landing') { setDocking(false); enter.current?.focus({ preventScroll: true }) } }, [state.stage])
  useEffect(() => { if (state.stage === 'landing' || state.stage === 'releasing' || state.stage === 'complete' || state.stage === 'returning') mic.stop() }, [state.stage, mic.stop])
  useEffect(() => {
    if (state.stage === 'releasing') sound.playRelease(reduced ? 0.85 : 4.65)
    if (state.stage === 'complete') sound.playCompletion()
  }, [state.stage, reduced, sound.playRelease, sound.playCompletion])
  const canHome = state.stage === 'complete' || (state.stage === 'writing' && !state.text && !voice.busy)
  return <div className={`app stage-${state.stage} ${docking && state.stage === 'entering' ? 'notebook-docking' : ''} ${state.stage === 'returning' && homeVisible ? 'home-arriving' : ''} ${reduced ? 'reduced-motion' : ''}`}>
    <div className="cosmic-atmosphere" aria-hidden="true" />
    <StarfieldScene stage={showNotebook && state.stage === 'entering' ? 'writing' : state.stage} reduced={reduced} />
    <div className="grain-overlay" aria-hidden="true" />
    <header className="site-header">
      {canHome ? <button className="brand brand-button" aria-label="Whisp, return home" onClick={() => ritualDispatch({ type: 'HOME' })}>whisp<span>✧</span></button> : <div className="brand">whisp<span>✧</span></div>}
      <span className="header-caption">A LITTLE SPACE TO LET GO</span>
      <button className="sound-toggle" onClick={() => void sound.toggle()} title={sound.playback === 'waiting' ? 'Sound is on and starts when you enter' : sound.playback === 'paused' || sound.playback === 'error' ? 'Tap to resume sound' : undefined} aria-pressed={sound.enabled} aria-label={sound.enabled && (sound.playback === 'error' || sound.playback === 'paused') ? 'Resume sound' : sound.enabled ? 'Sound on, turn ambient sound off' : 'Sound off, turn ambient sound on'}><Icon name={sound.enabled ? 'sound' : 'mute'} size={18} /><span>{sound.enabled && (sound.playback === 'error' || sound.playback === 'paused') ? 'Resume sound' : `Sound ${sound.enabled ? 'on' : 'off'}`}</span></button>
    </header>
    <main id="main-content">
      {!showNotebook ? <section className={`cosmic-landing ${state.stage === 'entering' ? 'departing' : ''}`} aria-label="Welcome to Whisp">
        <div className="celestial-orbit" aria-hidden="true"><div className="orbit-ring orbit-one" /><div className="orbit-ring orbit-two" /><div className="orbit-spark">✦</div><div className="orbit-core" /></div>
        <div className="landing-content">
          <p className="eyebrow landing-eyebrow"><span /> A MOMENT TO YOURSELF <span /></p>
          <div className="hero-wordmark" aria-hidden="true">Whisp<span className="wordmark-star">✧</span></div>
          <h1>A quiet space to<br /><em>set your thoughts down.</em></h1>
          <p className="tagline">A private notebook to write, breathe, and let go.</p>
          <button ref={enter} className="enter-button" onClick={enterSpace} disabled={state.stage !== 'landing'}>Enter your space <Icon name="arrow" size={19} /></button>
          <div className="entry-preferences">
            <label className="mic-default"><input type="checkbox" checked={micWanted} disabled={state.stage !== 'landing'} onChange={event => setMicWanted(event.target.checked)} /><span>Microphone on when you enter</span></label>
            <p>We’ll ask permission. Breath analysis stays on your device.<br />{sound.enabled ? 'Gentle sound begins on entry. Mute it anytime.' : 'You’ll enter quietly, with sound off.'}</p>
          </div>
          <p className="private-caption"><Icon name="lock" size={12} /> Private by design. Free to use. Yours for a moment.</p>
        </div>
        <div className="landing-footnote" aria-hidden="true"><span className="tiny-star">✦</span><span>YOU DON’T HAVE TO CARRY EVERYTHING.</span></div>
      </section> : <NotebookExperience state={state} dispatch={ritualDispatch} reduced={reduced} mic={mic} toggleMic={toggleMic} sensitivity={sensitivity} setSensitivity={setSensitivity} voice={voice} startVoice={startVoice} finishVoice={finishVoice} quote={quote} paperRef={paper} playInk={sound.playInk} cacheStatus={cacheStatus} />}
      {state.stage === 'returning' && <ReturnJourney revealingHome={homeVisible} reduced={reduced} paper={paper} skip={() => ritualDispatch({ type: 'HOME_DONE' })} />}
      {state.stage === 'entering' && <PortalTransition docking={docking} quick={quickDock} reduced={reduced} paper={paper} skip={skipJourney} />}
    </main>
    <footer className="site-footer">
      <p>Made with care by <a href="https://labs.rubangino.ca/" target="_blank" rel="noreferrer noopener">Ruban AI Labs <span aria-hidden="true">↗</span></a></p>
      <div className="footer-right"><span className="always-free">ALWAYS FREE.</span><button className="privacy-button" onClick={event => { event.currentTarget.focus(); setPrivacy(true) }}><Icon name="lock" size={13} /> Your words stay yours</button><button className="help-button" aria-label="Help and how your data is cleared" onClick={event => { event.currentTarget.focus(); setPrivacy(true) }}><Icon name="help" size={18} /><span>Help</span></button></div>
    </footer>
    {privacy && <PrivacyInfo voiceBusy={voice.busy} close={() => setPrivacy(false)} />}
  </div>
}
