import { describe, expect, it } from 'vitest'
import { sampleInkPixels } from './ink'
describe('ink sampling', () => {
  it('originates only from actual opaque ink pixels at the correct DPR', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4)
    data[(2 * 4 + 3) * 4 + 3] = 255
    expect(sampleInkPixels(data, 4, 4, 100, 2)).toEqual([{ x: 1.5, y: 1, alpha: 1 }])
  })
  it('bounds particles while sampling the full visible region', () => {
    const data = new Uint8ClampedArray(400 * 200 * 4).fill(255)
    const points = sampleInkPixels(data, 400, 200, 1800)
    expect(points.length).toBeLessThanOrEqual(1800)
    expect(points.some(p => p.y > 195)).toBe(true)
    expect(sampleInkPixels(new Uint8ClampedArray(16), 2, 2, 100)).toEqual([])
  })
})
