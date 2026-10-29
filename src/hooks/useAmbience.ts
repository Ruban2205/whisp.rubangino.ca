import { useCallback, useEffect, useRef, useState } from 'react'
import { Soundscape, type SoundScene } from '../lib/soundscape'
export function useAmbience(scene: SoundScene, listening: boolean, breathCandidate: boolean, voiceTyping = false) {
  const [enabled, setEnabled] = useState(true)
  const [playback, setPlayback] = useState<'waiting' | 'playing' | 'paused' | 'error'>('waiting')
  const audio = useRef<{ context: AudioContext; score: Soundscape } | null>(null)
  const preferred = useRef(true)
  const desired = useRef({ scene, listening, breathCandidate, voiceTyping })
  desired.current = { scene, listening, breathCandidate, voiceTyping }
  const dispose = useCallback(() => {
    const current = audio.current; audio.current = null
    if (current) { current.score.dispose(); current.context.onstatechange = null; if (current.context.state !== 'closed') void current.context.close().catch(() => {}) }
  }, [])
  const start = useCallback(async (requested?: SoundScene) => {
    if (!preferred.current || document.hidden) return
    const next = requested || desired.current.scene
    let created: AudioContext | undefined
    try {
      if (!audio.current) {
        const Audio = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const context = new Audio()
        created = context
        audio.current = { context, score: new Soundscape(context) }
      }
      const current = audio.current
      const resumed = current.context.resume()
      current.score.setListening(desired.current.listening, desired.current.breathCandidate, desired.current.voiceTyping)
      if (next === 'journey') current.score.playJourney()
      if (next === 'notebook') current.score.startNotebook()
      await resumed
      if (audio.current !== current) return
      setPlayback('playing')
      current.context.onstatechange = () => { if (current.context.state !== 'running' && current.context.state !== 'closed') setPlayback('paused') }
    } catch { dispose(); if (created && created.state !== 'closed') void created.close().catch(() => {}); setPlayback('error') }
  }, [dispose])
  const toggle = useCallback(() => {
    if (preferred.current && playback !== 'error' && playback !== 'paused') {
      preferred.current = false; setEnabled(false); dispose(); setPlayback('waiting')
    } else {
      preferred.current = true; setEnabled(true); void start()
    }
  }, [dispose, playback, start])
  useEffect(() => {
    const current = audio.current
    if (!current) return
    current.score.setListening(listening, breathCandidate, voiceTyping)
    if (scene === 'notebook') current.score.startNotebook()
    if (scene === 'journey') current.score.playJourney()
    if (scene === 'quiet' && current.score.scene !== 'quiet') { dispose(); setPlayback('waiting') }
  }, [scene, listening, breathCandidate, voiceTyping, dispose])
  useEffect(() => {
    const hidden = () => { if (document.hidden) { dispose(); setPlayback('paused') } }
    document.addEventListener('visibilitychange', hidden)
    return () => { document.removeEventListener('visibilitychange', hidden); dispose() }
  }, [dispose])
  const playRelease = useCallback((duration?: number) => { if (preferred.current) audio.current?.score.playRelease(duration) }, [])
  const playCompletion = useCallback(() => { if (preferred.current) audio.current?.score.playCompletion() }, [])
  const playInk = useCallback(() => { if (preferred.current) audio.current?.score.playInk() }, [])
  return { enabled, playback, toggle, start, playRelease, playCompletion, playInk }
}
