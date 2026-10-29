import { describe, expect, it } from 'vitest'
import { initialState, ritualReducer as reduce, type RitualState } from './state'
const writing = (text = 'A little worry'): RitualState => ({ stage: 'writing', text, released: null })
describe('ritual state machine', () => {
  it('enters once and arrives deterministically', () => {
    const entering = reduce(initialState, { type: 'ENTER' })
    expect(entering.stage).toBe('entering')
    expect(reduce(entering, { type: 'ENTER' })).toBe(entering)
    expect(reduce(initialState, { type: 'ARRIVE' })).toBe(initialState)
    expect(reduce(entering, { type: 'ARRIVE' }).stage).toBe('writing')
  })
  it('preserves native editing values including long Unicode entries', () => {
    const text = 'مرحبا 世界 👩🏽‍🚀 café\n\n'.repeat(4000)
    expect(reduce(writing(), { type: 'EDIT', text }).text).toBe(text)
  })
  it('appends spoken text to current edits and ignores late speech after release starts', () => {
    expect(reduce(writing('Typed first.'), { type: 'APPEND_SPEECH', text: 'Spoken next.' }).text).toBe('Typed first. Spoken next.')
    const releasing = reduce(writing(), { type: 'RELEASE' })
    expect(reduce(releasing, { type: 'APPEND_SPEECH', text: 'Late' })).toBe(releasing)
  })
  it('rejects empty releases and edits during release', () => {
    const blank = writing(' \n ')
    expect(reduce(blank, { type: 'RELEASE' })).toBe(blank)
    const releasing = reduce(writing(), { type: 'RELEASE' })
    expect(reduce(releasing, { type: 'EDIT', text: 'oops' })).toBe(releasing)
    expect(reduce(releasing, { type: 'RELEASE' })).toBe(releasing)
    expect(releasing.text).toBe('A little worry')
  })
  it('clears only after successful completion and restores exactly once', () => {
    const complete = reduce(reduce(writing('私の思い\n🌙'), { type: 'RELEASE' }), { type: 'RELEASE_DONE' })
    expect(complete).toEqual({ stage: 'complete', text: '', released: '私の思い\n🌙' })
    expect(reduce(complete, { type: 'UNDO' })).toEqual(writing('私の思い\n🌙'))
    expect(reduce(reduce(complete, { type: 'EXPIRE' }), { type: 'UNDO' }).text).toBe('')
  })
  it('guards reverse navigation against repeated clicks and stray completion events', () => {
    const returning = reduce(writing(''), { type: 'HOME' })
    expect(returning.stage).toBe('returning')
    expect(reduce(returning, { type: 'HOME' })).toBe(returning)
    expect(reduce(returning, { type: 'ENTER' })).toBe(returning)
    expect(reduce(writing('Draft'), { type: 'HOME_DONE' })).toEqual(writing('Draft'))
  })
  it('keeps writing if rendering fails, and drops released references on restart', () => {
    expect(reduce(reduce(writing(), { type: 'RELEASE' }), { type: 'RELEASE_FAILED' })).toEqual(writing())
    const complete = reduce(reduce(writing(), { type: 'RELEASE' }), { type: 'RELEASE_DONE' })
    expect(reduce(complete, { type: 'AGAIN' })).toEqual(writing(''))
    expect(reduce(complete, { type: 'HOME' })).toEqual({ stage: 'returning', text: '', released: null })
    expect(reduce(reduce(complete, { type: 'HOME' }), { type: 'HOME_DONE' })).toEqual(initialState)
    expect(reduce(writing(), { type: 'HOME' })).toEqual(writing())
  })
})
