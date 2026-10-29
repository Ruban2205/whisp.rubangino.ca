import { createServer } from 'vite'
import fs from 'node:fs/promises'
import react from '@vitejs/plugin-react'

const server = await createServer({ configFile: false, plugins: [react()], cacheDir: 'node_modules/.vite-prerender', optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: 'custom' })
try {
  const { renderLanding } = await server.ssrLoadModule('/src/entry-server.tsx')
  const html = await fs.readFile('dist/index.html', 'utf8')
  if (!html.includes('<div id="root"></div>')) throw new Error('Missing empty application root for prerender')
  await fs.writeFile('dist/index.html', html.replace('<div id="root"></div>', `<div id="root">${renderLanding()}</div>`))
  console.log('Initial public landing page pre-rendered into static HTML. No browser writing or audio is involved.')
} finally { await server.close() }
