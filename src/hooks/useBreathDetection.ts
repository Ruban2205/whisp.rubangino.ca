import { useCallback, useEffect, useRef, useState } from 'react'
import { BreathGate, defaultBreathConfig, gentleBreathConfig, extractFeatures, microphoneError, type BreathSensitivity } from '../lib/breath'
export type MicStatus = 'inactive' | 'requesting' | 'waiting' | 'calibrating' | 'ready' | 'error'
interface Options { calibrate: boolean; armed: boolean; sensitivity: BreathSensitivity }
export function useBreathDetection(onBreath: () => void, options: Options) {
  const [status, setStatus] = useState<MicStatus>('inactive')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [level, setLevel] = useState(0)
  const resources = useRef<{ stream?: MediaStream; context?: AudioContext; source?: MediaStreamAudioSourceNode; analyser?: AnalyserNode; frame?: number }>({})
  const generation = useRef(0)
  const mounted = useRef(true)
  const callback = useRef(onBreath)
  const settings = useRef(options)
  callback.current = onBreath; settings.current = options
  const dispose = useCallback(() => {
    generation.current++
    const { frame, stream, context, source, analyser } = resources.current
    resources.current = {}
    if (frame) cancelAnimationFrame(frame)
    if (context) context.onstatechange = null
    stream?.getTracks().forEach(track => { track.onended = null; track.stop() })
    source?.disconnect(); analyser?.disconnect()
    if (context && context.state !== 'closed') void context.close().catch(() => {})
  }, [])
  const stop = useCallback(() => {
    dispose()
    if (mounted.current) { setStatus('inactive'); setProgress(0); setLevel(0); setMessage('') }
  }, [dispose])
  const start = useCallback(async () => {
    dispose()
    const ticket = generation.current
    const current = () => mounted.current && generation.current === ticket
    const fail = (message: string) => { if (current()) { dispose(); setStatus('error'); setProgress(0); setLevel(0); setMessage(message) } }
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('error'); setMessage('Microphone listening is unavailable in this browser. You can still use Let it go.'); return }
    setStatus('requesting'); setMessage('Allow the microphone when your browser asks.'); setProgress(0); setLevel(0)
    try {
      const Audio = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Audio) throw new Error('Web Audio is unavailable')
      // Resume inside the click gesture, before awaiting permission (important on Safari).
      const context = new Audio()
      resources.current.context = context
      const resumed = context.resume().then(() => true, error => { fail(microphoneError(error)); return false })
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }, video: false })
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return }
      resources.current.stream = stream
      if (!(await resumed) || !current()) return
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.15
      source.connect(analyser) // Analysis only: never connected to speakers or a recorder.
      Object.assign(resources.current, { source, analyser })
      stream.getAudioTracks().forEach(track => { track.onended = () => fail('Your microphone disconnected. You can still use Let it go.') })
      context.onstatechange = () => { if (context.state !== 'running' && context.state !== 'closed') fail('Microphone listening paused. Tap Use my breath to reconnect.') }
      const samples = new Float32Array(analyser.fftSize)
      const spectrum = new Float32Array(analyser.frequencyBinCount)
      let gate: BreathGate | null = null, sensitivity = settings.current.sensitivity
      let lastUi = 0, lastStatus: MicStatus = 'waiting'
      setStatus('waiting'); setMessage('Microphone allowed. Listening starts when the notebook opens.')
      const tick = (now: number) => {
        if (!current()) return
        try {
          const { calibrate, armed } = settings.current
          if (calibrate) {
            if (!gate || sensitivity !== settings.current.sensitivity) {
              sensitivity = settings.current.sensitivity
              gate = new BreathGate(sensitivity === 'gentle' ? gentleBreathConfig : defaultBreathConfig)
              lastStatus = 'calibrating'; setStatus('calibrating'); setProgress(0)
              setMessage('A moment of quiet… finding the room’s rhythm.')
            }
            analyser.getFloatTimeDomainData(samples); analyser.getFloatFrequencyData(spectrum)
            const result = gate.update(extractFeatures(samples, spectrum, context.sampleRate, analyser.fftSize), now, armed)
            if (result.detected) { stop(); callback.current(); return }
            if (!result.calibrating && lastStatus !== 'ready') { lastStatus = 'ready'; setStatus('ready') }
            if (now - lastUi > 80) {
              setProgress(result.progress); setLevel(result.level); lastUi = now
              if (!result.calibrating) setMessage(!armed ? 'Microphone on. Write something first; an empty page cannot be released.' : result.progress > 0.05 ? 'A gentle breath… keep going for a moment.' : 'Listening. Blow gently near your device’s microphone for about a second.')
            }
          }
          resources.current.frame = requestAnimationFrame(tick)
        } catch (error) { fail(microphoneError(error)) }
      }
      resources.current.frame = requestAnimationFrame(tick)
    } catch (error) { fail(microphoneError(error)) }
  }, [dispose, stop])
  useEffect(() => {
    mounted.current = true
    const hidden = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', hidden)
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', hidden); dispose() }
  }, [dispose, stop])
  return { status, message, progress, level, start, stop, active: status === 'requesting' || status === 'waiting' || status === 'calibrating' || status === 'ready' }
}
export type BreathDetection = ReturnType<typeof useBreathDetection>
