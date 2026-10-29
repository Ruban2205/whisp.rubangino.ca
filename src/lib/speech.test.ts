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

import { cleanSpeechTranscript, hasAudibleSpeechCandidate } from './speech'
describe('non-speech annotation filtering', () => {
  it('removes labels that should never become notebook writing', () => {
    for (const label of ['[BLANK_AUDIO]', 'Blank Audio', 'blank_audio', '[Music]', '(soft music)', 'Music.', '[Silence] [Music]', '♪', '<|nospeech|>', '(crying)', '[applause]']) expect(cleanSpeechTranscript(label)).toBe('')
  })
  it('keeps meaningful speech, including sentences about music and crying', () => {
    expect(cleanSpeechTranscript('Music helps me feel calm.')).toBe('Music helps me feel calm.')
    expect(cleanSpeechTranscript('I am crying because I miss my friend.')).toBe('I am crying because I miss my friend.')
    expect(cleanSpeechTranscript('[Music] I need a quiet moment. [BLANK_AUDIO]')).toBe('I need a quiet moment.')
    expect(cleanSpeechTranscript('(I want to keep this thought.)')).toBe('(I want to keep this thought.)')
    expect(appendSpokenText('Typed words about Music.', '[Blank Audio]')).toBe('Typed words about Music.')
  })
  it('rejects silent and extremely short PCM without suppressing audible speech', () => {
    expect(hasAudibleSpeechCandidate(new Float32Array(16000))).toBe(false)
    expect(hasAudibleSpeechCandidate(new Float32Array(16000).fill(0.0001))).toBe(false)
    expect(hasAudibleSpeechCandidate(new Float32Array(500).fill(0.1))).toBe(false)
    expect(hasAudibleSpeechCandidate(new Float32Array(16000).fill(0.02))).toBe(true)
  })
})
