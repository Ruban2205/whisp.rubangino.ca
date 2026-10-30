export interface AudioFeatures {
  rms: number
  flatness: number
  highRatio: number
  lowRatio: number
  crest: number
  /** Normalized pitch autocorrelation: voiced sound approaches 1, turbulent air approaches 0. */
  voicing?: number
}
export type BreathSensitivity = 'normal' | 'gentle'
export interface BreathConfig { calibrationMs: number; sustainedMs: number; confidenceThreshold: number; minimumRms: number; noiseMultiplier: number }
// A small reduction in Normal’s amplitude requirement keeps the deep-breath ritual
// while retaining its sustained, spectral and voicing checks.
export const defaultBreathConfig: BreathConfig = { calibrationMs: 1200, sustainedMs: 650, confidenceThreshold: 0.6, minimumRms: 0.003, noiseMultiplier: 1.8 }
export const gentleBreathConfig: BreathConfig = { ...defaultBreathConfig, sustainedMs: 750, minimumRms: 0.0018, noiseMultiplier: 1.5 }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function extractFeatures(samples: Float32Array, spectrumDb: Float32Array, sampleRate: number, fftSize: number): AudioFeatures {
  let squares = 0, peak = 0, mean = 0
  for (const value of samples) { squares += value * value; mean += value; peak = Math.max(peak, Math.abs(value)) }
  mean /= Math.max(1, samples.length)
  const rms = Math.sqrt(squares / Math.max(1, samples.length))
  let power = 0, logPower = 0, high = 0, low = 0, count = 0
  for (let i = 1; i < spectrumDb.length; i++) {
    const hz = i * sampleRate / fftSize
    // Direct wind often lives below 150 Hz. The old pass band discarded that evidence.
    if (hz < 45 || hz > Math.min(6500, sampleRate / 2)) continue
    const p = Math.max(1e-12, Math.pow(10, spectrumDb[i] / 10))
    power += p; logPower += Math.log(p); count++
    if (hz > 1400) high += p
    if (hz < 550) low += p
  }
  // Coarse normalized autocorrelation rejects pitched speech/hums without assuming all breath is a hiss.
  // Downsample the search, not the input; work is bounded to ~40k multiplies per analysis frame.
  let voicing = 0
  if (rms > 0.0005) {
    for (let lag = Math.floor(sampleRate / 450); lag <= Math.min(samples.length / 2, sampleRate / 75); lag += 8) {
      let cross = 0, a = 0, b = 0
      for (let i = 0; i < samples.length - lag; i += 4) {
        const x = samples[i] - mean, y = samples[i + lag] - mean
        cross += x * y; a += x * x; b += y * y
      }
      voicing = Math.max(voicing, cross / Math.max(1e-12, Math.sqrt(a * b)))
    }
  }
  return { rms, flatness: count ? Math.exp(logPower / count) / Math.max(1e-12, power / count) : 0, highRatio: high / Math.max(1e-12, power), lowRatio: low / Math.max(1e-12, power), crest: peak / Math.max(1e-9, rms), voicing }
}

export class BreathGate {
  private started: number | null = null
  private previous: number | null = null
  private floor = 0.0008
  private calibration: number[] = []
  private sustained = 0
  private fired = false
  constructor(readonly config: BreathConfig = defaultBreathConfig) {}
  update(features: AudioFeatures, now: number, armed = true) {
    this.started ??= now
    const dt = Math.min(50, Math.max(0, now - (this.previous ?? now)))
    this.previous = now
    if (now - this.started < this.config.calibrationMs) {
      this.calibration.push(features.rms)
      const sorted = [...this.calibration].sort((a, b) => a - b)
      // A low percentile prevents a cough or an early puff during calibration from making breath impossible.
      this.floor = Math.max(0.0005, sorted[Math.floor((sorted.length - 1) * 0.2)] || 0)
      return { calibrating: true, progress: 0, confidence: 0, level: 0, detected: false }
    }
    this.calibration.length = 0
    const threshold = Math.max(this.config.minimumRms, this.floor * this.config.noiseMultiplier)
    const strength = clamp((features.rms / threshold - 0.6) / 1.2)
    const noise = clamp((features.flatness - 0.015) / 0.16)
    const wind = features.lowRatio > 0.35 ? clamp((features.rms / threshold - 1) / 1.2) : 0
    const unvoiced = clamp((0.72 - (features.voicing ?? 0.1)) / 0.4)
    const confidence = (strength * 0.45 + Math.max(noise, wind) * 0.35 + unvoiced * 0.2)
    const spectralEvidence = features.flatness > 0.045 || (features.lowRatio > 0.35 && features.rms > threshold * 1.65)
    const likely = armed && features.rms >= threshold && spectralEvidence && (features.voicing ?? 0) < 0.72 && features.crest < 9 && confidence >= this.config.confidenceThreshold
    this.sustained = likely ? this.sustained + dt : Math.max(0, this.sustained - dt * 1.8)
    // Adapt downward readily after room noise settles; never learn a candidate breath as the new floor.
    if (!likely && features.rms < threshold) {
      const adaptation = features.rms < this.floor * 0.6 ? 0.12 : 0.005
      this.floor = this.floor * (1 - adaptation) + Math.max(0.0005, features.rms) * adaptation
    }
    const detected = !this.fired && this.sustained >= this.config.sustainedMs
    if (detected) this.fired = true
    return { calibrating: false, confidence, progress: clamp(this.sustained / this.config.sustainedMs), level: clamp(features.rms / Math.max(threshold * 3, 0.008)), detected }
  }
}

export function microphoneError(error: unknown): string {
  const name = error instanceof Error || error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone permission was declined. You can still use Let it go.'
  if (name === 'NotFoundError') return 'No microphone was found. You can still use Let it go.'
  if (name === 'NotReadableError') return 'Your microphone is busy or unavailable. Try again, or use Let it go.'
  return 'The microphone could not stay connected. Try again, or use Let it go.'
}
