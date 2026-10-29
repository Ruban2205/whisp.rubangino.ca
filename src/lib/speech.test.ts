import { describe, expect, it } from 'vitest'
import { appendSpokenText, resamplePcm, trimSpeechOverlap } from './speech'
describe('private speech text and PCM', () => {
  it('appends recognized words without replacing typed writing', () => {
    expect(appendSpokenText('My own words.', '  And spoken words. ')).toBe('My own words. And spoken words.')
    expect(appendSpokenText('First\n', '第二')).toBe('First\n第二')
    expect(appendSpokenText('Keep this', '  ')).toBe('Keep this')
  })
  it('removes only the known overlap between adjacent audio segments', () => {
    expect(trimSpeechOverlap('I can begin again.', 'begin again. One moment at a time.')).toBe('One moment at a time.')
    expect(trimSpeechOverlap('My voice is here', 'Something new')).toBe('Something new')
  })
  it('resamples microphone rates to the required model sample rate', () => {
    const input = new Float32Array(48000).fill(0.25)
    const output = resamplePcm(input, 48000)
    expect(output).toHaveLength(16000)
    expect(output[8000]).toBe(0.25)
    expect(input[8000]).toBe(0.25)
    expect(resamplePcm(output, 16000)).toBe(output)
  })
})
