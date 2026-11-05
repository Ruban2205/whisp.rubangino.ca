import { renderToString } from 'react-dom/server'
import { SiteRoot } from './SiteRoot'
import { ErrorSpace } from './components/ErrorSpace'
import { PublicInfoPage } from './components/PublicInfoPage'
import { staticErrorKinds, type ErrorKind } from './lib/errors'
import { structuredData, publicPages } from './lib/site'
export { staticErrorKinds, structuredData, publicPages }
// Only the empty public state is rendered; no browser session or user data enters a build.
export function renderLanding() { return renderToString(<SiteRoot path="/" />) }
export function renderPublicPage(page: 'about' | 'guide') { return renderToString(<PublicInfoPage page={page} />) }
export function renderErrorPage(kind: ErrorKind, embedded = false) { return renderToString(<ErrorSpace kind={kind} embedded={embedded} />) }
