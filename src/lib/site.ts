export const siteUrl = 'https://whisp.rubangino.ca/'
export const developer = { name: 'Ruban Gino Singh', alternateName: 'Ruban Gino', url: 'https://www.rubangino.ca/', id: 'https://www.rubangino.ca/#person' }
export const business = { name: 'Ruban AI Labs', url: 'https://labs.rubangino.ca/', id: 'https://labs.rubangino.ca/#organization' }
export const publicPages = {
  home: { path: '/', title: 'Whisp — Private Online Notebook | Ruban Gino Singh', description: 'A free, private online notebook by Ruban Gino Singh at Ruban AI Labs. Write or speak your thoughts and let them go. No account or saved drafts.' },
  about: { path: '/about/', title: 'About Whisp — Ruban Gino Singh & Ruban AI Labs', description: 'Meet Ruban Gino Singh, also known as Ruban Gino, the developer of Whisp. Learn about this private notebook and Ruban AI Labs.' },
  guide: { path: '/how-it-works/', title: 'How Whisp Works — Private Writing, Voice & Letting Go', description: 'Learn how to use Whisp’s private online notebook, on-device voice typing, breath release, supportive notes, and temporary writing without an account.' },
} as const
export type PublicPage = keyof typeof publicPages
export function structuredData(page: PublicPage = 'home') {
  const metadata = publicPages[page]
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Person', '@id': developer.id, name: developer.name, alternateName: developer.alternateName, url: developer.url, jobTitle: 'AI Engineer and Full-Stack AI Developer', description: 'Ruban Gino Singh is the developer of Whisp. His official portfolio focuses on AI engineering, full-stack development, and production-ready AI systems.', affiliation: { '@id': business.id } },
    { '@type': 'Organization', '@id': business.id, name: business.name, url: business.url, description: 'Ruban AI Labs is an independent AI startup in Alberta, Canada, building intelligent agents, copilots, and automation systems.' },
    { '@type': 'WebSite', '@id': siteUrl + '#website', name: 'Whisp', url: siteUrl, description: publicPages.home.description, inLanguage: 'en', creator: { '@id': developer.id }, publisher: { '@id': business.id } },
    { '@type': 'WebApplication', '@id': siteUrl + '#app', name: 'Whisp', url: siteUrl, description: publicPages.home.description, applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', browserRequirements: 'JavaScript enabled. HTTPS and microphone permission for optional breath and voice input.', isAccessibleForFree: true, inLanguage: 'en', image: siteUrl + 'og-image.png', author: { '@id': developer.id }, creator: { '@id': developer.id }, publisher: { '@id': business.id }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' }, featureList: ['Private online notebook without an account', 'On-device English voice typing', 'Breath, button, or swipe release', '100 original supportive notes', 'No saved drafts or cloud transcription'] },
    { '@type': page === 'about' ? 'AboutPage' : 'WebPage', '@id': siteUrl.replace(/\/$/, '') + metadata.path + '#page', url: siteUrl.replace(/\/$/, '') + metadata.path, name: metadata.title, description: metadata.description, isPartOf: { '@id': siteUrl + '#website' }, mainEntity: { '@id': siteUrl + '#app' }, about: [{ '@id': siteUrl + '#app' }, { '@id': developer.id }, { '@id': business.id }], inLanguage: 'en' },
  ] }
}
