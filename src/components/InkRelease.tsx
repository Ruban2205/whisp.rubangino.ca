import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { snapshotInk } from '../lib/ink'

interface Props { editor: HTMLTextAreaElement; reduced: boolean; onDone: () => void; onError: () => void }
export function InkRelease({ editor, reduced, onDone, onError }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const callbacks = useRef({ onDone, onError })
  callbacks.current = { onDone, onError }
  useEffect(() => {
    let cancelled = false, frame = 0, fallback = 0, started = 0, previous = 0, elapsed = 0
    const finish = () => { if (!cancelled) callbacks.current.onDone() }
    const run = async () => {
      try {
        const el = canvas.current
        const ctx = el?.getContext('2d')
        if (!el || !ctx || reduced) {
          editor.classList.add('ink-fallback')
          fallback = window.setTimeout(finish, reduced ? 650 : 1700)
          return
        }
        const snapshot = await snapshotInk(editor, window.innerWidth < 600 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 1800 : 4200)
        if (cancelled) return
        if (!snapshot || !snapshot.points.length) {
          editor.classList.add('ink-fallback'); fallback = window.setTimeout(finish, 1200); return
        }
        const width = window.innerWidth, height = window.innerHeight
        el.width = width * snapshot.dpr; el.height = height * snapshot.dpr
        ctx.scale(snapshot.dpr, snapshot.dpr)
        const particles = snapshot.points.map(point => ({ ...point, delay: point.x / snapshot.width * 0.75 + (point.y / snapshot.height) * 0.2, speed: 0.65 + Math.random() * 0.7, phase: Math.random() * Math.PI * 2, radius: 0.45 + Math.random() * 1.2 }))
        editor.classList.add('ink-transferred')
        const draw = (now: number) => {
          if (cancelled) return
          started ||= now; previous ||= now
          if (!document.hidden) elapsed += Math.min(now - previous, 60)
          previous = now
          const t = elapsed / 1000
          ctx.clearRect(0, 0, width, height)
          const anticipation = Math.max(0, t - 0.3)
          // Narrow bands retain real text pixels until the wind reaches them; no unrelated particle explosion.
          for (let x = 0; x < snapshot.width; x += 4) {
            const delay = x / snapshot.width * 0.75
            ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (anticipation - delay) / 0.52))
            const sw = Math.min(4, snapshot.width - x)
            ctx.drawImage(snapshot.texture, x * snapshot.dpr, 0, sw * snapshot.dpr, snapshot.texture.height, snapshot.x + x, snapshot.y, sw, snapshot.height)
          }
          ctx.globalAlpha = 1
          for (const p of particles) {
            const age = anticipation - p.delay
            if (age < 0) continue
            const life = Math.min(1, age / 2.85)
            if (life >= 1) continue
            const ease = age * age
            // Smooth directional wind plus two perpendicular sine fields approximates a coherent curl flow.
            const wind = ease * 90 * p.speed
            const curl = Math.sin(p.y * 0.018 + age * 2.3 + p.phase) * age * 16
            const x = snapshot.x + p.x + wind + curl
            const y = snapshot.y + p.y - ease * 44 * p.speed + Math.cos(p.x * 0.012 + age * 1.8 + p.phase) * age * 18
            const alpha = (1 - life) * Math.min(1, age * 6) * p.alpha
            const gold = Math.min(1, age * 0.8)
            ctx.fillStyle = `rgba(${Math.round(53 + gold * 164)},${Math.round(66 + gold * 125)},${Math.round(69 + gold * 64)},${alpha})`
            ctx.beginPath(); ctx.arc(x, y, Math.max(0.15, p.radius * (1 - life * 0.8)), 0, Math.PI * 2); ctx.fill()
            if (age > 0.7 && p.radius > 1.2) {
              ctx.strokeStyle = `rgba(223,199,149,${alpha * 0.17})`; ctx.lineWidth = p.radius * 0.7
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - age * 7, y + age * 3); ctx.stroke()
            }
          }
          if (t >= 4.65) finish()
          else frame = requestAnimationFrame(draw)
        }
        frame = requestAnimationFrame(draw)
      } catch { if (!cancelled) callbacks.current.onError() }
    }
    void run()
    return () => { cancelled = true; cancelAnimationFrame(frame); clearTimeout(fallback); editor.classList.remove('ink-transferred', 'ink-fallback') }
  }, [editor, reduced])
  return createPortal(<canvas className="ink-canvas" ref={canvas} aria-hidden="true" />, document.body)
}
