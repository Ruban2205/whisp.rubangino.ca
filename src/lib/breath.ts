export interface AudioFeatures { rms: number; flatness: number; highRatio: number; lowRatio: number; crest: number }
export interface BreathConfig { calibrationMs: number; sustainedMs: number; confidenceThreshold: number; minimumRms: number }
export const defaultBreathConfig: BreathConfig = { calibrationMs: 1400, sustainedMs: 850, confidenceThreshold: 0.72, minimumRms: 0.009 }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

/** Spectral flatness approaches 1 for broadband noise, and 0 for tonal signals. */
export function extractFeatures(samples: Float32Array, spectrumDb: Float32Array, sampleRate: number, fftSize: number): AudioFeatures {
  let squares = 0, peak = 0
  for (const value of samples) { squares += value * value; peak = Math.max(peak, Math.abs(value)) }
  const rms = Math.sqrt(squares / Math.max(1, samples.length))
  let power = 0, logPower = 0, high = 0, low = 0, count = 0
  for (let i = 1; i < spectrumDb.length; i++) {
    const hz = i * sampleRate / fftSize
    if (hz < 150 || hz > Math.min(6500, sampleRate / 2)) continue
    const p = Math.max(1e-12, Math.pow(10, spectrumDb[i] / 10))
    power += p; logPower += Math.log(p); count++
    if (hz > 1400) high += p
    if (hz < 450) low += p
  }
  return { rms, flatness: count ? Math.exp(logPower / count) / Math.max(1e-12, power / count) : 0, highRatio: high / Math.max(1e-12, power), lowRatio: low / Math.max(1e-12, power), crest: peak / Math.max(1e-9, rms) }
}

export class BreathGate {
  private started: number | null = null
  private previous: number | null = null
  private floor = 0.002
  private calibrationSum = 0
  private calibrationFrames = 0
  private sustained = 0
  private fired = false
  constructor(readonly config: BreathConfig = defaultBreathConfig) {}
  update(features: AudioFeatures, now: number) {
    this.started ??= now
    const dt = Math.min(70, Math.max(0, now - (this.previous ?? now)))
    this.previous = now
    if (now - this.started < this.config.calibrationMs) {
      this.calibrationSum += features.rms; this.calibrationFrames++
      this.floor = Math.max(0.002, this.calibrationSum / this.calibrationFrames)
      return { calibrating: true, progress: 0, confidence: 0, detected: false }
    }
    const threshold = Math.max(this.config.minimumRms, this.floor * 2.4)
    const intensity = clamp((features.rms / threshold - 0.7) / 0.8)
    const broadband = clamp((features.flatness - 0.08) / 0.27)
    const hiss = clamp((features.highRatio - 0.12) / 0.3)
    const notVoiced = clamp((0.7 - features.lowRatio) / 0.4)
    const notImpulse = features.crest < 5.5 ? 1 : 0
    const confidence = (intensity * 0.35 + broadband * 0.3 + hiss * 0.2 + notVoiced * 0.15) * notImpulse
    const likely = features.rms >= threshold && features.flatness > 0.14 && features.highRatio > 0.2 && confidence >= this.config.confidenceThreshold
    // A tap never accumulates enough time. Brief gaps decay rather than abruptly flicker.
    this.sustained = likely ? this.sustained + dt : Math.max(0, this.sustained - dt * 2.5)
    if (!likely && features.rms < threshold) this.floor = this.floor * 0.995 + Math.max(0.001, features.rms) * 0.005
    const detected = !this.fired && this.sustained >= this.config.sustainedMs
    if (detected) this.fired = true
    return { calibrating: false, confidence, progress: clamp(this.sustained / this.config.sustainedMs), detected }
  }
}

export function microphoneError(error: unknown): string {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone permission was declined. You can still use Let it go.'
  if (name === 'NotFoundError') return 'No microphone was found. You can still use Let it go.'
  if (name === 'NotReadableError') return 'Your microphone is busy or unavailable. Try again, or use Let it go.'
  return 'The microphone could not stay connected. Try again, or use Let it go.'
}
