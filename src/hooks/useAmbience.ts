import { useCallback, useEffect, useRef, useState } from 'react'
export function useAmbience() {
  const [enabled, setEnabled] = useState(false)
  const audio = useRef<{ context: AudioContext; source: AudioBufferSourceNode; gain: GainNode } | null>(null)
  const stop = useCallback(() => {
    const current = audio.current; audio.current = null
    if (current) { current.source.stop(); current.source.disconnect(); current.gain.disconnect(); void current.context.close().catch(() => {}) }
    setEnabled(false)
  }, [])
  const toggle = useCallback(async () => {
    if (audio.current) { stop(); return }
    let context: AudioContext | undefined
    try {
      context = new AudioContext()
      const buffer = context.createBuffer(1, context.sampleRate * 6, context.sampleRate)
      const data = buffer.getChannelData(0)
      let last = 0
      // Quiet brown noise, synthesized locally; no external audio or copyrighted recordings.
      for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.018) / 1.025; data[i] = last }
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true
      const gain = context.createGain(); gain.gain.value = 0.19
      source.connect(gain); gain.connect(context.destination)
      audio.current = { context, source, gain }
      await context.resume()
      if (audio.current?.context !== context) return
      source.start(); setEnabled(true)
    } catch { if (context?.state !== 'closed') void context?.close().catch(() => {}); audio.current = null; setEnabled(false) }
  }, [stop])
  useEffect(() => {
    const visibility = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', visibility)
    return () => { document.removeEventListener('visibilitychange', visibility); const current = audio.current; if (current) { try { current.source.stop() } catch { /* Already stopped. */ } void current.context.close().catch(() => {}); audio.current = null } }
  }, [stop])
  return { enabled, toggle }
}
