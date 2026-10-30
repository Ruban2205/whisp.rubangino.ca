import { describe, expect, it } from 'vitest'
import { BreathGate, gentleBreathConfig, extractFeatures, microphoneError, type AudioFeatures, type BreathConfig } from './breath'
const quiet: AudioFeatures = { rms: 0.002, flatness: 0.5, highRatio: 0.65, lowRatio: 0.1, crest: 3, voicing: 0.12 }
const breath: AudioFeatures = { ...quiet, rms: 0.05 }
function calibrated(config?: BreathConfig) { const gate = new BreathGate(config); for (let t = 0; t <= 1400; t += 20) gate.update(quiet, t); return gate }
describe('local breath heuristics', () => {
  it('requires quiet calibration and sustained broadband sound, and fires once', () => {
    const gate = calibrated()
    expect(gate.update(breath, 1420).detected).toBe(false)
    let detected = 0
    for (let t = 1440; t < 4000; t += 20) if (gate.update(breath, t).detected) detected++
    expect(detected).toBe(1)
  })
  it('rejects impulses, voiced sound and isolated short noises', () => {
    for (const config of [undefined, gentleBreathConfig]) for (const feature of [{ ...breath, crest: 12 }, { ...breath, flatness: 0.03, highRatio: 0.08, lowRatio: 0.8, voicing: 0.95 }]) {
      const gate = calibrated(config)
      for (let t = 1420; t < 4000; t += 20) expect(gate.update(feature, t).detected).toBe(false)
    }
    const gate = calibrated()
    for (let t = 1420; t < 5000; t += 20) expect(gate.update(t % 1000 < 120 ? breath : quiet, t).detected).toBe(false)
  })
  it('adapts to continuous background noise without releasing', () => {
    const gate = new BreathGate()
    for (let t = 0; t < 10000; t += 20) expect(gate.update({ ...quiet, rms: 0.04 }, t).detected).toBe(false)
  })
  it('does not treat a long scheduling gap as sustained breath', () => {
    const gate = calibrated()
    expect(gate.update(breath, 60000).progress).toBeLessThan(0.1)
  })
  it('extracts finite signal metrics and distinguishes tonal spectra', () => {
    const samples = new Float32Array([0.1, -0.1, 0.1, -0.1])
    const flat = new Float32Array(1024).fill(-45)
    const tonal = new Float32Array(1024).fill(-100); tonal[30] = -10
    expect(extractFeatures(samples, flat, 48000, 2048).rms).toBeCloseTo(0.1)
    expect(extractFeatures(samples, flat, 48000, 2048).flatness).toBeCloseTo(1)
    expect(extractFeatures(samples, tonal, 48000, 2048).flatness).toBeLessThan(0.01)
    expect(extractFeatures(new Float32Array(4), flat, 48000, 2048).crest).toBe(0)
  })
  it('recognizes low-frequency turbulent wind that the old high-frequency gate rejected', () => {
    const gate = calibrated()
    const wind = { rms: 0.018, flatness: 0.02, highRatio: 0.03, lowRatio: 0.91, crest: 4.8, voicing: 0.28 }
    let detected = false
    for (let t = 1420; t < 2600; t += 20) detected ||= gate.update(wind, t).detected
    expect(detected).toBe(true)
  })
  it('recognizes softer breath and provides a gentler setting for quiet microphones', () => {
    for (const [config, amplitude] of [[undefined, 0.0033], [gentleBreathConfig, 0.0025]] as const) {
      const gate = new BreathGate(config)
      for (let t = 0; t <= 1400; t += 20) gate.update({ ...quiet, rms: 0.0006 }, t)
      let detected = false
      for (let t = 1420; t < 3000; t += 20) detected ||= gate.update({ ...breath, rms: amplitude, flatness: 0.12, voicing: 0.2 }, t).detected
      expect(detected).toBe(true)
    }
  })
  it('ignores an early loud calibration puff and cannot release while the editor is unarmed', () => {
    const gate = new BreathGate()
    for (let t = 0; t <= 1400; t += 20) gate.update(t < 500 ? breath : quiet, t)
    for (let t = 1420; t < 3000; t += 20) expect(gate.update(breath, t, false).detected).toBe(false)
    let detected = false
    for (let t = 3000; t < 4200; t += 20) detected ||= gate.update(breath, t, true).detected
    expect(detected).toBe(true)
  })
  it('measures low-frequency wind energy and rejects periodic voiced input', () => {
    const rate = 48000, size = 2048
    const samples = new Float32Array(size)
    for (let i = 0; i < size; i++) samples[i] = Math.sin(2 * Math.PI * 180 * i / rate) * 0.04
    const spectrum = new Float32Array(size / 2).fill(-95); spectrum[4] = -20
    const features = extractFeatures(samples, spectrum, rate, size)
    expect(features.lowRatio).toBeGreaterThan(0.95)
    expect(features.voicing).toBeGreaterThan(0.9)
    const gate = calibrated()
    for (let t = 1420; t < 4000; t += 20) expect(gate.update(features, t).detected).toBe(false)
  })
  it('explains permission denial and missing hardware without losing the manual path', () => {
    expect(microphoneError(new DOMException('', 'NotAllowedError'))).toContain('declined')
    expect(microphoneError(new DOMException('', 'NotFoundError'))).toContain('No microphone')
    expect(microphoneError(new Error())).toContain('Let it go')
  })
})
