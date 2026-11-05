import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { structuredData } from './src/lib/site.ts'

export default defineConfig({
  plugins: [react(), {
    name: 'whisp-public-pages',
    transformIndexHtml(html) { return html.replace('<!-- WHISP_STRUCTURED_DATA -->', `<script type="application/ld+json">${JSON.stringify(structuredData()).replaceAll('<', '\\u003c')}</script>`) },
    configurePreviewServer(server) {
      // Mirror a static host's genuine 404 response instead of preview's SPA fallback.
      server.middlewares.use((req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method || '')) return next()
        let pathname: string
        try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname) } catch { pathname = '/invalid-url' }
        const root = path.resolve(server.config.root, server.config.build.outDir)
        const target = path.resolve(root, '.' + pathname)
        const inside = target === root || target.startsWith(root + path.sep)
        if (inside && fs.existsSync(target)) {
          const entry = fs.statSync(target)
          if (entry.isFile() || (entry.isDirectory() && fs.existsSync(path.join(target, 'index.html')))) return next()
        }
        const fallback = path.join(root, '404.html')
        if (!fs.existsSync(fallback)) return next()
        res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('X-Robots-Tag', 'noindex, follow'); res.setHeader('Cache-Control', 'no-store')
        if (req.method === 'HEAD') res.end(); else res.end(fs.readFileSync(fallback))
      })
    },
  }],
  build: { license: { fileName: 'licenses/BUNDLED_DEPENDENCIES.md' } },
  worker: { format: 'es' },
  optimizeDeps: { include: ['@huggingface/transformers'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
