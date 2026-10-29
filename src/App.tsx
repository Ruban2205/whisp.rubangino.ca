import { useEffect, useReducer, useRef, useState } from 'react'
import { initialState, ritualReducer } from './lib/state'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useAmbience } from './hooks/useAmbience'
import { StarfieldScene } from './components/StarfieldScene'
import { NotebookExperience } from './components/NotebookExperience'
import { PrivacyInfo } from './components/PrivacyInfo'
import { Icon } from './components/Icon'
import { useBreathDetection } from './hooks/useBreathDetection'
import type { BreathSensitivity } from './lib/breath'
import { JOURNEY_MS } from './lib/soundscape'
import type { RitualEvent } from './lib/state'

export default function App() {
  const [state, dispatch] = useReducer(ritualReducer, initialState)
  const [privacy, setPrivacy] = useState(false)
  const reduced = useReducedMotion()
  const [micWanted, setMicWanted] = useState(true)
  const [sensitivity, setSensitivity] = useState<BreathSensitivity>('normal')
  const mic = useBreathDetection(() => dispatch({ type: 'RELEASE' }), {
    calibrate: state.stage === 'writing', armed: state.stage === 'writing' && Boolean(state.text.trim()), sensitivity,
  })
  const sound = useAmbience(state.stage === 'entering' ? 'journey' : state.stage === 'landing' ? 'quiet' : 'notebook', mic.active, mic.progress > 0.04)
  const enterSpace = () => {
    if (state.stage !== 'landing') return
    void sound.start('journey')
    if (micWanted) void mic.start()
    dispatch({ type: 'ENTER' })
  }
  const toggleMic = () => {
    if (mic.active) { setMicWanted(false); mic.stop() }
    else { setMicWanted(true); void mic.start() }
  }
  const ritualDispatch = (event: RitualEvent) => {
    if ((event.type === 'AGAIN' || event.type === 'UNDO') && micWanted) void mic.start()
    dispatch(event)
  }
  const enter = useRef<HTMLButtonElement>(null)
  const cosmic = state.stage === 'landing' || state.stage === 'entering'
  useEffect(() => {
    if (state.stage !== 'entering') return
    const timer = window.setTimeout(() => dispatch({ type: 'ARRIVE' }), reduced ? 120 : JOURNEY_MS)
    return () => clearTimeout(timer)
  }, [state.stage, reduced])
  useEffect(() => {
    if (!state.text || (state.stage !== 'writing' && state.stage !== 'releasing')) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [state.text, state.stage])
  useEffect(() => { if (state.stage === 'landing') enter.current?.focus({ preventScroll: true }) }, [state.stage])
  useEffect(() => { if (state.stage === 'landing' || state.stage === 'releasing' || state.stage === 'complete') mic.stop() }, [state.stage, mic.stop])
  const canHome = state.stage === 'complete' || (state.stage === 'writing' && !state.text)
  return <div className={`app stage-${state.stage} ${reduced ? 'reduced-motion' : ''}`}>
    <div className="cosmic-atmosphere" aria-hidden="true" />
    <StarfieldScene stage={state.stage} reduced={reduced} />
    <div className="grain-overlay" aria-hidden="true" />
    <header className="site-header">
      {canHome ? <button className="brand brand-button" aria-label="Whisp, return home" onClick={() => dispatch({ type: 'HOME' })}>whisp<span>✧</span></button> : <div className="brand">whisp<span>✧</span></div>}
      <span className="header-caption">A LITTLE SPACE TO LET GO</span>
      <button className="sound-toggle" onClick={() => void sound.toggle()} title={sound.playback === 'waiting' ? 'Sound is on and starts when you enter' : sound.playback === 'paused' || sound.playback === 'error' ? 'Tap to resume sound' : undefined} aria-pressed={sound.enabled} aria-label={sound.enabled && (sound.playback === 'error' || sound.playback === 'paused') ? 'Resume sound' : sound.enabled ? 'Sound on, turn ambient sound off' : 'Sound off, turn ambient sound on'}><Icon name={sound.enabled ? 'sound' : 'mute'} size={18} /><span>{sound.enabled && (sound.playback === 'error' || sound.playback === 'paused') ? 'Resume sound' : `Sound ${sound.enabled ? 'on' : 'off'}`}</span></button>
    </header>
    <main id="main-content">
      {cosmic ? <section className={`cosmic-landing ${state.stage === 'entering' ? 'departing' : ''}`} aria-label="Welcome to Whisp">
        <div className="celestial-orbit" aria-hidden="true"><div className="orbit-ring orbit-one" /><div className="orbit-ring orbit-two" /><div className="orbit-spark">✦</div><div className="orbit-core" /></div>
        <div className="landing-content">
          <p className="eyebrow landing-eyebrow"><span /> A QUIET MOMENT, JUST FOR YOU <span /></p>
          <div className="hero-wordmark" aria-hidden="true">Whisp<span className="wordmark-star">✧</span></div>
          <h1>Some thoughts are easier<br />to <em>release</em> than to carry.</h1>
          <p className="tagline">Write it. Breathe it out. Let it go.</p>
          <button ref={enter} className="enter-button" onClick={enterSpace} disabled={state.stage === 'entering'}>Enter your space <Icon name="arrow" size={19} /></button>
          <div className="entry-preferences">
            <label className="mic-default"><input type="checkbox" checked={micWanted} disabled={state.stage === 'entering'} onChange={event => setMicWanted(event.target.checked)} /><span>Microphone on when you enter</span></label>
            <p>We’ll ask permission. Audio stays on your device.<br />{sound.enabled ? 'Sound starts on entry. You can mute it anytime.' : 'You’ll enter quietly, with sound off.'}</p>
          </div>
          <p className="private-caption"><Icon name="lock" size={12} /> A private little corner of the universe.</p>
        </div>
        <div className="landing-footnote" aria-hidden="true"><span className="tiny-star">✦</span><span>YOU DON’T HAVE TO CARRY EVERYTHING.</span></div>
      </section> : <NotebookExperience state={state} dispatch={ritualDispatch} reduced={reduced} mic={mic} toggleMic={toggleMic} sensitivity={sensitivity} setSensitivity={setSensitivity} />}
      {state.stage === 'entering' && <div className="journey" role="status"><div className="journey-portal" aria-hidden="true" /><div className="journey-rings" aria-hidden="true"><span /><span /><span /></div><p>Leaving a little noise behind…</p><button className="text-button skip-button" onClick={() => dispatch({ type: 'ARRIVE' })}>Skip journey <Icon name="arrow" size={15} /></button></div>}
    </main>
    <footer className="site-footer">
      <p>Made with care by <a href="https://rubangino.ca" target="_blank" rel="noreferrer noopener">Ruban AI Labs <span aria-hidden="true">↗</span></a></p>
      <div className="footer-right"><span className="always-free">ALWAYS FREE.</span><button className="privacy-button" onClick={event => { event.currentTarget.focus(); setPrivacy(true) }}><Icon name="lock" size={13} /> Your words stay yours</button><button className="help-button" aria-label="Help and how your data is cleared" onClick={event => { event.currentTarget.focus(); setPrivacy(true) }}><Icon name="help" size={18} /><span>Help</span></button></div>
    </footer>
    {privacy && <PrivacyInfo close={() => setPrivacy(false)} />}
  </div>
}
