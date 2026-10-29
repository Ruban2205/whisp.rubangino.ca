import { useCallback, useEffect, useRef, useState } from 'react'
import { BreathGate, extractFeatures, microphoneError } from '../lib/breath'
export type MicStatus = 'inactive' | 'requesting' | 'calibrating' | 'ready' | 'error'
export function useBreathDetection(onBreath: () => void) {
  const [status, setStatus] = useState<MicStatus>('inactive')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const resources = useRef<{ stream?: MediaStream; context?: AudioContext; source?: MediaStreamAudioSourceNode; analyser?: AnalyserNode; frame?: number }>({})
  const generation = useRef(0)
  const mounted = useRef(true)
  const callback = useRef(onBreath)
  callback.current = onBreath
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
    if (mounted.current) { setStatus('inactive'); setProgress(0); setMessage('') }
  }, [dispose])
  const start = useCallback(async () => {
    dispose()
    const ticket = generation.current
    const current = () => mounted.current && generation.current === ticket
    const fail = (message: string) => { if (current()) { dispose(); setStatus('error'); setProgress(0); setMessage(message) } }
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('error'); setMessage('Microphone listening is unavailable in this browser. You can still use Let it go.'); return }
    setStatus('requesting'); setMessage('Allow the microphone when your browser asks.'); setProgress(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false })
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return }
      resources.current.stream = stream
      const Audio = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Audio) throw new Error('Web Audio is unavailable')
      const context = new Audio()
      resources.current.context = context
      await context.resume()
      if (!current()) return
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.25
      source.connect(analyser) // Intentionally never connected to speakers; no recording or feedback.
      Object.assign(resources.current, { source, analyser })
      stream.getAudioTracks().forEach(track => { track.onended = () => fail('Your microphone disconnected. You can still use Let it go.') })
      context.onstatechange = () => { if (context.state === 'suspended' || context.state === 'interrupted' as AudioContextState) fail('Microphone listening paused. Tap Use my breath to reconnect.') }
      const samples = new Float32Array(analyser.fftSize)
      const spectrum = new Float32Array(analyser.frequencyBinCount)
      const gate = new BreathGate()
      let lastUi = 0, lastStatus = 'calibrating'
      setStatus('calibrating'); setMessage('A moment of quiet… finding the room’s rhythm.')
      const tick = (now: number) => {
        if (!current()) return
        try {
          analyser.getFloatTimeDomainData(samples); analyser.getFloatFrequencyData(spectrum)
          const result = gate.update(extractFeatures(samples, spectrum, context.sampleRate, analyser.fftSize), now)
          if (result.detected) { stop(); callback.current(); return }
          if (!result.calibrating && lastStatus !== 'ready') { lastStatus = 'ready'; setStatus('ready'); setMessage('Listening. Blow gently toward your microphone.') }
          if (now - lastUi > 65) { setProgress(result.progress); lastUi = now }
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
  return { status, message, progress, start, stop, active: status === 'requesting' || status === 'calibrating' || status === 'ready' }
}
