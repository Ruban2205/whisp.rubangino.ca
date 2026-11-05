import { useEffect } from 'react'
import { SessionBoundary } from './components/SessionBoundary'
import { ErrorGallery, ErrorSpace } from './components/ErrorSpace'
import { PublicInfoPage } from './components/PublicInfoPage'
import { errorPages, type ErrorKind } from './lib/errors'
import { publicPages, siteUrl, structuredData, type PublicPage } from './lib/site'

export function SiteRoot({ path = typeof window === 'undefined' ? '/' : window.location.pathname }: { path?: string }) {
  const page: PublicPage | null = path === '/' || path === '/index.html' ? 'home' : /^\/about\/?$/.test(path) ? 'about' : /^\/how-it-works\/?$/.test(path) ? 'guide' : null
  // Vite removes this preview routing and the gallery from the production bundle.
  const candidate = import.meta.env.DEV ? path.match(/^\/errors\/([a-z]+)\/?$/)?.[1] || path.replace(/^\//, '').replace(/\.html$/, '') : ''
  const kind: ErrorKind = Object.hasOwn(errorPages, candidate) ? candidate as ErrorKind : '404'
  useEffect(() => {
    if (page) {
      const metadata = publicPages[page]
      document.title = metadata.title
      document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description)
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow, max-image-preview:large')
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', siteUrl.replace(/\/$/, '') + metadata.path)
      const script = document.querySelector('script[type="application/ld+json"]')
      if (script) script.textContent = JSON.stringify(structuredData(page))
    } else {
      document.title = import.meta.env.DEV && /^\/errors\/?$/.test(path) ? 'Whisp — Error screen previews' : `${errorPages[kind].title} — Whisp`
      document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, follow')
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [page, path, kind])
  if (page === 'home') return <SessionBoundary />
  if (page) return <PublicInfoPage page={page} />
  if (import.meta.env.DEV && (path === '/errors/' || path === '/errors')) return <ErrorGallery />
  return <ErrorSpace kind={kind} />
}
