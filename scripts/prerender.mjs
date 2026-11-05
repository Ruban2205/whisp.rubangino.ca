import { createServer } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
const server = await createServer({ configFile: false, plugins: [react()], cacheDir: 'node_modules/.vite-prerender', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: 'custom' })
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
try {
  const { renderLanding, renderPublicPage, renderErrorPage, staticErrorKinds, structuredData, publicPages } = await server.ssrLoadModule('/src/entry-server.tsx')
  // Remove old preview artifacts even if this generator is used with an existing output.
  for (const file of ['errors', 'offline.html', 'startup.html']) await fs.rm(path.join('dist', file), { recursive: true, force: true })
  const css = await fs.readFile('public/error-space.css', 'utf8')
  const assets = await fs.readdir('dist/assets')
  const font = prefix => {
    const file = assets.find(file => file.startsWith(prefix) && file.endsWith('.woff2'))
    if (!file) throw new Error(`Missing standalone page font: ${prefix}`)
    return '/assets/' + file
  }
  const faces = `@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400;src:url('${font('cormorant-garamond-latin-400-normal-')}') format('woff2');font-display:swap}@font-face{font-family:'DM Sans';font-style:normal;font-weight:400;src:url('${font('dm-sans-latin-400-normal-')}') format('woff2');font-display:swap}`
  const document = ({ title, description, body, page }) => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#0b171d"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${page ? 'index, follow, max-image-preview:large' : 'noindex, follow'}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${page ? `<link rel="canonical" href="https://whisp.rubangino.ca${publicPages[page].path}"><meta name="author" content="Ruban Gino Singh"><link rel="author" href="https://www.rubangino.ca/"><meta property="og:type" content="website"><meta property="og:site_name" content="Whisp"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="https://whisp.rubangino.ca${publicPages[page].path}"><meta property="og:image" content="https://whisp.rubangino.ca/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Whisp, a little space to let go, by Ruban Gino Singh and Ruban AI Labs"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="https://whisp.rubangino.ca/og-image.png"><script type="application/ld+json">${JSON.stringify(structuredData(page)).replaceAll('<', '\\u003c')}</script>` : ''}<style>html,body{margin:0;min-width:280px;background:#0b171d}${faces}${css}</style></head><body>${body}</body></html>`
  const write = async (file, value) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value) }
  let html = await fs.readFile('dist/index.html', 'utf8')
  if (!html.includes('<div id="root"></div>')) throw new Error('Missing empty application root for prerender')
  html = html.replace('<div id="root"></div>', `<div id="root">${renderLanding()}</div>`).replace('</body>', `<section id="startup-error" class="startup-error" hidden aria-label="Page loading recovery">${renderErrorPage('startup', true)}</section></body>`)
  await write('dist/index.html', html)
  for (const page of ['about', 'guide']) await write(`dist${publicPages[page].path}index.html`, document({ ...publicPages[page], page, body: renderPublicPage(page) }))
  for (const kind of staticErrorKinds) await write(`dist/${kind}.html`, document({ title: `${kind.toUpperCase()} — Whisp`, description: 'A little help returning to your space.', body: renderErrorPage(kind) }))
  console.log('Pre-rendered public landing, developer/guide pages, and static motion error pages. No browser writing or audio is involved.')
} finally { await server.close() }
