export type SoundScene = 'quiet' | 'journey' | 'notebook'
export const JOURNEY_MS = 8800
const chords = [
  [130.81, 196, 246.94, 293.66, 329.63], // Cmaj9
  [110, 164.81, 196, 246.94, 293.66],   // Am9
  [87.31, 130.81, 174.61, 220, 261.63], // Fmaj7
  [98, 146.83, 196, 220, 293.66],       // Gsus2
]

/** Original, locally synthesized score. No samples, downloads, recording, or copyrighted music. */
export class Soundscape {
  private master: GainNode
  private music: GainNode
  private entry: GainNode
  private reverb: ConvolverNode
  private wet: GainNode
  private sources = new Set<AudioScheduledSourceNode>()
  private timer: ReturnType<typeof setInterval> | null = null
  private nextChord = 0
  private chord = 0
  private disposed = false
  scene: SoundScene = 'quiet'

  constructor(readonly context: BaseAudioContext) {
    this.master = context.createGain(); this.master.gain.value = 0.5
    this.music = context.createGain(); this.music.gain.value = 0
    this.entry = context.createGain(); this.entry.gain.value = 1
    this.reverb = context.createConvolver()
    this.wet = context.createGain(); this.wet.gain.value = 0.32
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 3.5), context.sampleRate)
    let seed = 19
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647
        data[i] = (seed / 2147483647 * 2 - 1) * Math.pow(1 - i / data.length, 3) * 0.45
      }
    }
    this.reverb.buffer = impulse
    this.music.connect(this.master); this.entry.connect(this.master)
    this.music.connect(this.reverb); this.entry.connect(this.reverb)
    this.reverb.connect(this.wet); this.wet.connect(this.master)
    this.master.connect(context.destination)
  }

  private note(frequency: number, start: number, duration: number, volume: number, bus: GainNode, type: OscillatorType = 'sine') {
    if (this.disposed) return
    const tone = this.context.createOscillator(), envelope = this.context.createGain()
    tone.type = type; tone.frequency.value = frequency
    envelope.gain.setValueAtTime(0, start)
    envelope.gain.linearRampToValueAtTime(volume, start + Math.min(duration * 0.22, 2.5))
    envelope.gain.exponentialRampToValueAtTime(0.00001, start + duration)
    tone.connect(envelope); envelope.connect(bus)
    this.sources.add(tone)
    tone.onended = () => { tone.disconnect(); envelope.disconnect(); this.sources.delete(tone) }
    tone.start(start); tone.stop(start + duration + 0.05)
  }

  setListening(listening: boolean, breathCandidate = false) {
    const now = this.context.currentTime
    this.master.gain.cancelScheduledValues(now)
    // Duck promptly during a candidate breath so speaker leakage cannot build a sustained trigger.
    this.master.gain.setTargetAtTime(breathCandidate ? 0.008 : listening ? 0.24 : 0.5, now, breathCandidate ? 0.035 : 0.35)
  }

  playJourney(duration = JOURNEY_MS / 1000) {
    if (this.disposed || this.scene === 'journey') return
    this.stopMusic(); this.scene = 'journey'
    const now = this.context.currentTime + 0.03
    this.entry.gain.cancelScheduledValues(now); this.entry.gain.setValueAtTime(1, now)
    this.music.gain.setTargetAtTime(0, now, 0.4)
    const notes = [261.63, 392, 523.25, 587.33, 659.25, 783.99, 1046.5]
    notes.forEach((frequency, i) => {
      const start = now + i * (duration - 3) / notes.length
      this.note(frequency, start, 3.3, 0.055, this.entry)
      this.note(frequency * 2.003, start + 0.02, 1.8, 0.008, this.entry)
    })
    this.note(65.41, now, duration + 1, 0.04, this.entry)
  }

  startNotebook() {
    if (this.disposed || this.scene === 'notebook') return
    this.scene = 'notebook'
    const now = this.context.currentTime
    this.entry.gain.cancelScheduledValues(now); this.entry.gain.setTargetAtTime(0, now, 0.45)
    this.music.gain.cancelScheduledValues(now); this.music.gain.setTargetAtTime(1, now, 1.1)
    this.nextChord = now + 0.04; this.chord = 0
    this.scheduleMusic()
    this.timer = setInterval(() => this.scheduleMusic(), 400)
  }

  /** Also usable with OfflineAudioContext for deterministic audio rendering tests. */
  scheduleMusic() {
    if (this.scene !== 'notebook' || this.disposed) return
    while (this.nextChord < this.context.currentTime + 1) {
      const notes = chords[this.chord % chords.length]
      notes.forEach((frequency, i) => {
        this.note(frequency, this.nextChord + i * 0.07, 16, 0.031, this.music)
        this.note(frequency * 2.001, this.nextChord + i * 0.07, 15, 0.004, this.music)
      })
      this.note(notes[3] * 2, this.nextChord + 4.5, 5, 0.018, this.music)
      this.note(notes[4] * 2, this.nextChord + 8, 4.5, 0.013, this.music)
      this.nextChord += 12; this.chord++
    }
  }

  private stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.stopMusic()
    for (const source of this.sources) { source.onended = null; try { source.stop() } catch { /* Already stopped. */ } source.disconnect() }
    this.sources.clear()
    this.entry.disconnect(); this.music.disconnect(); this.reverb.disconnect(); this.wet.disconnect(); this.master.disconnect()
  }
}
