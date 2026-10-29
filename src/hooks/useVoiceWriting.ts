import { useCallback, useEffect, useRef, useState } from 'react'
import { microphoneError } from '../lib/breath'
import { trimSpeechOverlap, type SpeechWorkerMessage } from '../lib/speech'
export type VoiceStatus = 'idle' | 'loading' | 'requesting' | 'listening' | 'processing' | 'error'
interface Job { id: number; audio: Float32Array; sampleRate: number; overlap: boolean }
interface Capture { context?: AudioContext; stream?: MediaStream; source?: MediaStreamAudioSourceNode; node?: AudioWorkletNode; muted?: GainNode }

export function useVoiceWriting(onWords: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [message, setMessage] = useState('')
  const [level, setLevel] = useState(0)
  const callback = useRef(onWords); callback.current = onWords
  const mounted = useRef(true), generation = useRef(0)
  const worker = useRef<Worker | null>(null), capture = useRef<Capture>({})
  const jobs = useRef<Job[]>([]), processing = useRef(false), listening = useRef(false), finishing = useRef(false)
  const chunks = useRef<Float32Array[]>([]), samples = useRef(0), voiced = useRef(0), quiet = useRef(0)
  const sampleRate = useRef(16000), nextId = useRef(0), overlap = useRef(false), previousWords = useRef('')
  const sendNext = useRef<() => void>(() => {})
  const finishRef = useRef<() => void>(() => {})
  const stopCapture = useCallback(() => {
    listening.current = false
    const current = capture.current; capture.current = {}
    if (current.node) { current.node.port.onmessage = null; current.node.port.postMessage('stop'); current.node.disconnect() }
    current.source?.disconnect(); current.muted?.disconnect()
    current.stream?.getTracks().forEach(track => { track.onended = null; if (track.readyState !== 'ended') track.stop() })
    if (current.context && current.context.state !== 'closed') void current.context.close().catch(() => {})
  }, [])
  const discard = useCallback(() => {
    generation.current++; stopCapture(); worker.current?.terminate(); worker.current = null
    jobs.current.forEach(job => { if (job.audio.byteLength) job.audio.fill(0) }); jobs.current = []; sendNext.current = () => {}
    chunks.current.forEach(chunk => chunk.fill(0)); chunks.current = []
    samples.current = 0; voiced.current = 0; quiet.current = 0; processing.current = false
    previousWords.current = ''; overlap.current = false; finishing.current = false
  }, [stopCapture])
  const cancel = useCallback(() => {
    discard()
    if (mounted.current) { setStatus('idle'); setLevel(0); setMessage('Voice typing stopped. Words already on the page are still here.') }
  }, [discard])
  const enqueue = useCallback((keepOverlap = false) => {
    if (!samples.current || voiced.current < sampleRate.current * 0.18) {
      chunks.current.forEach(chunk => chunk.fill(0)); chunks.current = []; samples.current = 0; voiced.current = 0; quiet.current = 0; return
    }
    const audio = new Float32Array(samples.current)
    let offset = 0
    for (const chunk of chunks.current) { audio.set(chunk, offset); offset += chunk.length; chunk.fill(0) }
    jobs.current.push({ id: ++nextId.current, audio, sampleRate: sampleRate.current, overlap: overlap.current })
    chunks.current = keepOverlap ? [audio.slice(-Math.round(sampleRate.current * 0.4))] : []
    samples.current = chunks.current[0]?.length || 0
    voiced.current = keepOverlap ? samples.current : 0; quiet.current = 0; overlap.current = keepOverlap
    sendNext.current()
  }, [])
  const finish = useCallback(() => {
    if (finishing.current) return
    if (!listening.current) { if (!processing.current && !jobs.current.length) cancel(); return }
    finishing.current = true
    const ticket = generation.current
    setStatus('processing'); setMessage('Finishing your last words…')
    const node = capture.current.node
    const flush = node ? new Promise<void>(resolve => {
      const receive = node.port.onmessage
      const timeout = window.setTimeout(resolve, 150)
      node.port.onmessage = event => {
        receive?.call(node.port, event)
        if (event.data.final) { clearTimeout(timeout); resolve() }
      }
      node.port.postMessage('stop')
    }) : Promise.resolve()
    // Stop device input immediately while the audio thread flushes its final partial block.
    capture.current.stream?.getTracks().forEach(track => { track.onended = null; if (track.readyState !== 'ended') track.stop() })
    void flush.then(() => {
      if (!mounted.current || generation.current !== ticket) return
      stopCapture(); enqueue(false); setLevel(0); finishing.current = false
      if (processing.current || jobs.current.length) { setStatus('processing'); setMessage('Finishing your last words…') }
      else { discard(); setStatus('idle'); setMessage('Your words are on the page. Read them over, then take a gentle breath.') }
    })
  }, [cancel, discard, enqueue, stopCapture])
  finishRef.current = finish
  const start = useCallback(async () => {
    discard()
    const ticket = generation.current
    const current = () => mounted.current && generation.current === ticket
    const fail = (text: string) => { if (current()) { discard(); setStatus('error'); setMessage(text); setLevel(0) } }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode || !window.Worker) {
      setStatus('error'); setMessage('Private voice typing isn’t available in this browser. You can still type your thoughts.'); return
    }
    setStatus('loading'); setMessage('Preparing private voice typing. Loading the speech model from this site…')
    try {
      // Resume during the user's click; no input is requested or captured during the model download.
      let context: AudioContext
      try { context = new AudioContext({ sampleRate: 16000 }) } catch { context = new AudioContext() }
      capture.current.context = context
      const resumed = context.resume().then(() => true, () => false)
      const engine = new Worker(new URL('../workers/speech.worker.ts', import.meta.url), { type: 'module', name: 'whisp-private-speech' })
      worker.current = engine
      sendNext.current = () => {
        if (!current() || processing.current) return
        const job = jobs.current[0]
        if (!job) {
          if (!listening.current) { discard(); setStatus('idle'); setMessage('Your words are on the page. Read them over, then take a gentle breath.') }
          return
        }
        processing.current = true
        engine.postMessage({ type: 'transcribe', id: job.id, audio: job.audio, sampleRate: job.sampleRate }, [job.audio.buffer])
      }
      let lastProgress = -1
      const ready = new Promise<void>((resolve, reject) => {
        engine.onerror = () => { reject(new Error('Voice worker unavailable')); fail('Private voice typing could not start. Your typed words are safe. Try again or keep typing.') }
        engine.onmessage = (event: MessageEvent<SpeechWorkerMessage>) => {
          if (!current()) return
          const data = event.data
          if (data.type === 'progress' && data.progress !== undefined) {
            const percent = Math.floor(data.progress / 10) * 10
            if (percent !== lastProgress) { lastProgress = percent; setMessage(`Preparing private voice typing… ${percent}% of the current download. No microphone audio is captured yet.`) }
          }
          if (data.type === 'ready') resolve()
          if (data.type === 'error') { reject(new Error('Local transcription failed')); fail('Voice typing could not finish this part. Words already on the page are safe. Please try again.') }
          if (data.type === 'result') {
            const job = jobs.current.shift()
            if (!job || job.id !== data.id) return
            const raw = data.text || ''
            const text = job.overlap ? trimSpeechOverlap(previousWords.current, raw) : raw
            previousWords.current = raw.split(/\s+/).slice(-12).join(' ')
            if (text) callback.current(text)
            processing.current = false; sendNext.current()
          }
        }
      })
      engine.postMessage({ type: 'load' })
      await ready
      if (!current()) return
      if (!(await resumed)) throw new Error('Audio paused')
      setStatus('requesting'); setMessage('Allow microphone access for private voice typing.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
      if (!current()) { stream.getTracks().forEach(track => track.stop()); return }
      capture.current.stream = stream
      await context.audioWorklet.addModule('/voice-capture.worklet.js')
      if (!current()) return
      sampleRate.current = context.sampleRate
      const source = context.createMediaStreamSource(stream)
      const node = new AudioWorkletNode(context, 'whisp-voice-capture')
      const muted = context.createGain(); muted.gain.value = 0
      source.connect(node); node.connect(muted); muted.connect(context.destination)
      Object.assign(capture.current, { source, node, muted })
      listening.current = true
      stream.getAudioTracks().forEach(track => { track.onended = () => finishRef.current() })
      let floor = 0.0005, uiFrames = 0
      node.port.onmessage = (event: MessageEvent<{ audio: Float32Array; sampleRate: number }>) => {
        if (!current() || !listening.current) return
        const audio = event.data.audio
        let sum = 0
        for (const value of audio) sum += value * value
        const rms = Math.sqrt(sum / Math.max(1, audio.length))
        const speech = rms > Math.max(0.0015, floor * 2.5)
        if (!speech) floor = floor * 0.98 + rms * 0.02
        chunks.current.push(audio); samples.current += audio.length
        if (speech) { voiced.current += audio.length; quiet.current = 0 } else quiet.current += audio.length
        if (++uiFrames % 3 === 0) setLevel(Math.min(1, rms * 16))
        if (!voiced.current && samples.current > sampleRate.current * 0.5) {
          chunks.current.forEach(chunk => chunk.fill(0)); chunks.current = []; samples.current = 0; quiet.current = 0
        } else if (samples.current >= sampleRate.current * 12) enqueue(true)
        else if (voiced.current && quiet.current >= sampleRate.current * 0.75) enqueue(false)
        // Never silently discard a backlog. Stop input and finish every already captured segment.
        if (jobs.current.length >= 3) { finishRef.current(); setMessage('Catching up with your words. Listening has paused; your captured words are being finished.') }
      }
      setStatus('listening'); setMessage('Listening to your words. Pause naturally; they’ll appear a phrase at a time. English voice typing.')
    } catch (error) {
      fail(error instanceof DOMException ? microphoneError(error) : 'Private voice typing could not load. Your writing is safe. Please try again or keep typing.')
    }
  }, [discard, enqueue])
  useEffect(() => {
    mounted.current = true
    const hidden = () => { if (document.hidden && (worker.current || capture.current.context)) { if (listening.current) finishRef.current(); else cancel() } }
    document.addEventListener('visibilitychange', hidden)
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', hidden); discard() }
  }, [cancel, discard])
  return { status, message, level, start, finish, cancel, busy: status === 'loading' || status === 'requesting' || status === 'listening' || status === 'processing' }
}
export type VoiceWriting = ReturnType<typeof useVoiceWriting>
