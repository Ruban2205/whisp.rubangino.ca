/** Downsample PCM by averaging source intervals; bounded work with correct duration. */
export function resamplePcm(input: Float32Array, sourceRate: number, targetRate = 16000): Float32Array {
  if (sourceRate === targetRate) return input
  const ratio = sourceRate / targetRate
  const output = new Float32Array(Math.round(input.length / ratio))
  for (let i = 0; i < output.length; i++) {
    const from = Math.floor(i * ratio), to = Math.min(input.length, Math.max(from + 1, Math.floor((i + 1) * ratio)))
    let sum = 0
    for (let j = from; j < to; j++) sum += input[j]
    output[i] = sum / Math.max(1, to - from)
  }
  return output
}
// These are model-produced non-speech labels, not words to delete from ordinary sentences.
const annotation = /^(?:blank[\s_-]*audio|no[\s_-]*(?:audio|speech)|silence|silent|music|(?:soft|gentle|background|instrumental|upbeat|sad)\s+music|music\s+(?:playing|continues)|background\s+noise|noise|inaudible|unintelligible|applause|clapping|laughter|laughing|crying|sobbing|sniffling|coughing|breathing|wind|wind\s+blowing|sound\s+effects?)$/i
function isAnnotation(value: string): boolean {
  return annotation.test(value.trim().replace(/^[\s.,:;!…_-]+|[\s.,:;!…_-]+$/g, ''))
}
export function cleanSpeechTranscript(raw: string): string {
  let text = raw.replace(/<\|[^|]{1,80}\|>/g, '')
  text = text.replace(/\[([^\]]{1,100})\]|\(([^)]{1,100})\)/g, (whole, square: string | undefined, round: string | undefined) => isAnnotation(square ?? round ?? '') ? ' ' : whole)
  text = text.replace(/[♪♫♬]+/g, ' ').trim()
  // Bare labels are suppressed only when they make up a complete result/segment.
  const segments = text.split(/(?<=[.!?])\s+|[\r\n]+/).filter(segment => !isAnnotation(segment))
  text = segments.join(' ').replace(/\s+/g, ' ').replace(/^[\s.,:;!…-]+|[\s,:;…-]+$/g, '').trim()
  return isAnnotation(text) ? '' : text
}
export function hasAudibleSpeechCandidate(audio: Float32Array): boolean {
  if (audio.length < 1600) return false
  let power = 0, peak = 0
  for (const value of audio) { power += value * value; peak = Math.max(peak, Math.abs(value)) }
  // An extra guard prevents decoding silence/near-zero blocks even if capture framing submits one.
  return peak > 0.002 && Math.sqrt(power / audio.length) > 0.0008
}
export function appendSpokenText(current: string, spoken: string): string {
  const text = cleanSpeechTranscript(spoken)
  if (!text) return current
  return current + (current && !/\s$/.test(current) ? ' ' : '') + text
}
/** Only remove repetition at an intentionally overlapped audio-chunk boundary. */
export function trimSpeechOverlap(previous: string, next: string): string {
  const a = previous.trim().split(/\s+/), b = next.trim().split(/\s+/)
  const normalize = (word: string) => word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  for (let size = Math.min(12, a.length, b.length); size >= 1; size--) {
    if (a.slice(-size).every((word, index) => normalize(word) === normalize(b[index]))) return b.slice(size).join(' ')
  }
  return next.trim()
}
export interface SpeechWorkerMessage { type: 'ready' | 'progress' | 'result' | 'error'; id?: number; text?: string; progress?: number }
