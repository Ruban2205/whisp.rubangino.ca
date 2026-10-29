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
export function appendSpokenText(current: string, spoken: string): string {
  const text = spoken.trim()
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
