import { useEffect, useRef } from 'react'
import type { Stage } from '../lib/state'

export function StarfieldScene({ stage, reduced }: { stage: Stage; reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const current = useRef(stage)
  current.current = stage
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    let width = 0, height = 0, frame = 0, time = 0, last = 0
    let pointerX = 0, pointerY = 0
    const stars = Array.from({ length: window.innerWidth < 600 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 95 : 220 }, (_, i) => ({ x: Math.random(), y: Math.random(), z: Math.random(), phase: i * 2.39, radius: Math.random() * 1.1 + 0.25 }))
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      el.width = width * dpr; el.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduced) draw(0)
    }
    const draw = (now: number) => {
      const dt = Math.min(40, now - last || 16); last = now
      time += dt / 1000
      ctx.clearRect(0, 0, width, height)
      const entering = current.current === 'entering'
      const writing = current.current === 'writing' || current.current === 'complete' || current.current === 'releasing'
      for (const star of stars) {
        if (!reduced) star.z -= dt * (entering ? 0.00023 : 0.000006)
        if (star.z <= 0.04) star.z = 1
        const depth = 0.4 + star.z * 0.85
        const x = (star.x - 0.5) * width / depth + width / 2 + pointerX * (1 - star.z) * 16
        const y = (star.y - 0.5) * height / depth + height / 2 + pointerY * (1 - star.z) * 16
        const alpha = (0.25 + (Math.sin(time * 0.5 + star.phase) + 1) * 0.23) * (writing ? 0.45 : 1)
        ctx.fillStyle = `rgba(221,220,204,${alpha})`
        ctx.beginPath(); ctx.arc(x, y, star.radius / depth, 0, Math.PI * 2); ctx.fill()
        if (entering && !reduced) {
          ctx.strokeStyle = `rgba(225,216,190,${alpha * 0.3})`; ctx.lineWidth = star.radius * 0.65
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (x - width / 2) * 0.04, y + (y - height / 2) * 0.04); ctx.stroke()
        }
      }
      if (!reduced && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const pointer = (event: PointerEvent) => { if (event.pointerType === 'mouse') { pointerX = event.clientX / width - 0.5; pointerY = event.clientY / height - 0.5 } }
    const visibility = () => { cancelAnimationFrame(frame); if (!document.hidden && !reduced) { last = performance.now(); frame = requestAnimationFrame(draw) } }
    resize()
    if (!reduced) frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize); window.addEventListener('pointermove', pointer)
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility) }
  }, [reduced])
  return <canvas className="starfield" ref={canvas} aria-hidden="true" />
}
