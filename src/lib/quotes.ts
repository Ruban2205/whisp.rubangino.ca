export type QuoteTheme = 'overwhelm' | 'worry' | 'grief' | 'worth' | 'anger' | 'connection' | 'change' | 'rest' | 'courage' | 'possibility'
export interface SupportiveQuote { id: string; theme: QuoteTheme; text: string }

// Original writing for Whisp. Themes are a modest keyword hint, never an emotional diagnosis.
const collections: Record<QuoteTheme, string[]> = {
  overwhelm: [
    'You can set something down without giving up on yourself.',
    'Your next step can be small enough to take with a tired heart.',
    'You are allowed to meet this day one piece at a time.',
    'Everything asking for your attention does not need an answer tonight.',
    'A pause can be an act of strength.',
    'You do not have to hold the whole horizon in your hands.',
    'One unfinished day cannot measure the person you are becoming.',
    'Making room for yourself is worthy work.',
    'You can care deeply and still choose a gentler pace.',
    'For this moment, one breath is a complete beginning.',
  ],
  worry: [
    'You can take the next step without knowing the whole way.',
    'Uncertainty does not take away your capacity to begin.',
    'You do not have to solve tomorrow to deserve peace today.',
    'A worried thought is not the whole story of what is possible.',
    'You have permission to return to what is here, right now.',
    'Your courage can be quiet and still be real.',
    'You can leave some questions unanswered for tonight.',
    'There is room between a thought and the next thing you choose.',
    'This moment asks for your presence, not a perfect prediction.',
    'Trust can begin with one kind choice toward yourself.',
  ],
  grief: [
    'What you feel can be held gently, without being hurried away.',
    'Your tears do not make you smaller; your humanity is still whole.',
    'You are allowed to carry love and sadness in the same heart.',
    'There is no deadline for becoming tender with yourself.',
    'You do not have to turn this pain into a lesson today.',
    'A difficult goodbye cannot erase what mattered.',
    'You deserve company and kindness, even when words are hard.',
    'Rest can sit beside grief without asking it to leave.',
    'You may begin again without leaving your love behind.',
    'Your heart is worthy of patience through every season.',
  ],
  worth: [
    'You are worthy before you achieve, explain, or prove anything.',
    'One mistake cannot contain the whole truth of who you are.',
    'Your value is larger than the voice that doubts it.',
    'You can grow without treating yourself as something broken.',
    'You deserve the kindness you so readily offer others.',
    'You are allowed to be a person, not a performance.',
    'The unfinished parts of you are still worthy of care.',
    'You do not need to become someone else to deserve belonging.',
    'Your effort matters, even when nobody sees it.',
    'You can speak to yourself as someone worth protecting.',
  ],
  anger: [
    'You can honor what hurt without letting it choose your next step.',
    'Your boundaries can be clear and your heart can remain kind.',
    'You are allowed to step back before you decide what comes next.',
    'Strength can look like choosing a response that protects your peace.',
    'What happened matters; so does the care you give yourself now.',
    'You do not have to carry every argument into tomorrow.',
    'You can release this moment without excusing what hurt.',
    'Your voice deserves room, and your body deserves a pause.',
    'A quiet boundary can be a powerful beginning.',
    'You can choose what you carry forward from here.',
  ],
  connection: [
    'You deserve connection that lets you be fully yourself.',
    'You do not have to earn the right to ask for company.',
    'A small reach toward someone can be a brave beginning.',
    'You are worthy of being heard at your own pace.',
    'Your need for care is part of being human.',
    'You can belong without hiding every tender part of yourself.',
    'Being alone in this moment does not define your whole life.',
    'There is strength in letting someone know you could use kindness.',
    'Your story deserves space beyond the parts you make easy to tell.',
    'You deserve relationships with room for your real voice.',
  ],
  change: [
    'You can begin a new chapter without having every word ready.',
    'An unfamiliar path can still make room for you.',
    'Changing direction can be a way of staying true to yourself.',
    'You are allowed to outgrow a version of life that no longer fits.',
    'Beginnings can be gentle rather than grand.',
    'You can move forward and miss what came before.',
    'Your future does not need to repeat every part of your past.',
    'You can learn the next part while you are living it.',
    'A different pace is still a way forward.',
    'You are allowed to choose again with what you know today.',
  ],
  rest: [
    'Rest is not a reward you have to earn.',
    'You can be capable and still need a softer day.',
    'Your body deserves care before it reaches its limit.',
    'Doing less for a moment can make room for being yourself.',
    'You are allowed to stop without calling yourself a failure.',
    'Quiet time is still part of a meaningful life.',
    'You do not have to exhaust yourself to prove that you care.',
    'There is dignity in listening to what you need.',
    'You can let today be enough, even with things left undone.',
    'Taking care of yourself is a worthy use of this moment.',
  ],
  courage: [
    'You can be afraid and still take one honest step.',
    'Your courage does not need an audience to count.',
    'Asking for support can be one of your strongest choices.',
    'You can try again without pretending the last time was easy.',
    'Progress can be real even when it is hard to see.',
    'You are more than this moment asks of you.',
    'You can begin with the strength you have today.',
    'A small act of care can change how you meet the next moment.',
    'You do not have to feel ready to choose something kind for yourself.',
    'Your next beginning belongs to you.',
  ],
  possibility: [
    'There is more to your story than what feels heavy today.',
    'You are allowed to make room for something good.',
    'A softer moment can begin with the smallest choice.',
    'You can leave a little space for a different tomorrow.',
    'Your life has room for more than what you are carrying now.',
    'You do not need a perfect day to notice one beautiful thing.',
    'A fresh page does not ask you to be a different person.',
    'You can keep what matters and loosen your hold on the rest.',
    'There is room here for your next honest breath.',
    'You are allowed to begin again, exactly as you are.',
  ],
}
export const SUPPORTIVE_QUOTES: readonly SupportiveQuote[] = Object.entries(collections).flatMap(([theme, quotes]) => quotes.map((text, index) => ({ id: `${theme}-${index + 1}`, theme: theme as QuoteTheme, text })))
const hints: Record<QuoteTheme, RegExp> = {
  overwhelm: /\b(overwhelm\w*|stress\w*|pressure|deadline\w*|workload|too much|busy|work|exam\w*)\b/gi,
  worry: /\b(worr\w*|anxi\w*|uncertain\w*|panic\w*|overthink\w*|nervous|what if)\b/gi,
  grief: /\b(grie\w*|sad\w*|cry\w*|cried|tears?|loss|lost|died|death|miss\w*|goodbye|heartbreak\w*)\b/gi,
  worth: /\b(worth\w*|not enough|fail\w*|mistake\w*|hate myself|useless|ashamed|shame|guilt\w*|compare\w*)\b/gi,
  anger: /\b(ang\w*|furious|frustrat\w*|unfair|betray\w*|resent\w*|argument\w*|boundary|boundaries|hate)\b/gi,
  connection: /\b(lonel\w*|alone|isolat\w*|friend\w*|belong\w*|relationship\w*|unheard|nobody|no one)\b/gi,
  change: /\b(change\w*|new job|move|moving|start\w*|transition\w*|future|chapter|different|leaving)\b/gi,
  rest: /\b(tired|exhaust\w*|burn\w*|sleep\w*|rest|drain\w*|fatigue|energy)\b/gi,
  courage: /\b(afraid|fear\w*|try\w*|tried|brave|courage|support|progress|hard|difficult)\b/gi,
  possibility: /\b(hope\w*|tomorrow|begin\w*|possible|possibilit\w*|dream\w*|peace|fresh)\b/gi,
}
export class QuoteDeck {
  private used = new Set<string>()
  private last = ''
  constructor(private random: () => number = Math.random) {}
  pick(thought: string): SupportiveQuote {
    // Bound analysis work; never retain the text, derived tokens, or a psychological profile.
    const text = thought.slice(0, 12000)
    const scores = Object.entries(hints).map(([theme, pattern]) => ({ theme, score: [...text.matchAll(pattern)].length }))
    const best = Math.max(...scores.map(item => item.score))
    const themes = new Set(scores.filter(item => item.score === best).map(item => item.theme))
    const pool = best ? SUPPORTIVE_QUOTES.filter(quote => themes.has(quote.theme)) : [...SUPPORTIVE_QUOTES]
    let available = pool.filter(quote => !this.used.has(quote.id) && quote.id !== this.last)
    if (!available.length) {
      pool.forEach(quote => this.used.delete(quote.id))
      available = pool.filter(quote => quote.id !== this.last)
    }
    const quote = available[Math.min(available.length - 1, Math.floor(Math.max(0, this.random()) * available.length))]
    this.used.add(quote.id); this.last = quote.id
    return quote
  }
}
