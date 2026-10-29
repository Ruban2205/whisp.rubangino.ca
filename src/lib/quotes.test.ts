import { describe, expect, it } from 'vitest'
import { QuoteDeck, SUPPORTIVE_QUOTES } from './quotes'
describe('original supportive quote library', () => {
  it('contains exactly 100 unique original messages across ten themes', () => {
    expect(SUPPORTIVE_QUOTES).toHaveLength(100)
    expect(new Set(SUPPORTIVE_QUOTES.map(quote => quote.text)).size).toBe(100)
    expect(new Set(SUPPORTIVE_QUOTES.map(quote => quote.id)).size).toBe(100)
    expect(new Set(SUPPORTIVE_QUOTES.map(quote => quote.theme)).size).toBe(10)
  })
  it('uses a local word hint for relevant themes without retaining the thought', () => {
    const deck = new QuoteDeck(() => 0)
    expect(deck.pick('I am worried and anxious, and I keep overthinking.').theme).toBe('worry')
    expect(deck.pick('I am exhausted and tired. I cannot sleep.').theme).toBe('rest')
    expect(deck.pick('I cried. I miss someone and feel grief.').theme).toBe('grief')
    expect(JSON.stringify(deck)).not.toContain('I cried')
  })
  it('rotates all 100 when there are no keyword matches, and avoids immediate repeats', () => {
    const deck = new QuoteDeck(() => 0)
    const ids = Array.from({ length: 100 }, () => deck.pick('🌙').id)
    expect(new Set(ids).size).toBe(100)
    expect(deck.pick('🌙').id).not.toBe(ids.at(-1))
  })
  it('does not repeat within a relevant theme until its messages have been used', () => {
    const deck = new QuoteDeck(() => 0)
    const ids = Array.from({ length: 10 }, () => deck.pick('I feel lonely.').id)
    expect(new Set(ids).size).toBe(10)
    expect(deck.pick('I feel lonely.').id).not.toBe(ids.at(-1))
  })
})
