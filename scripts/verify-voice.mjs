import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
const base = process.env.WHISP_PREVIEW_URL || 'http://127.0.0.1:4173'
const asset = (await fs.readdir('dist/assets')).find(file => /^speech\.worker-.*\.js$/.test(file))
const workerPath = `/assets/${asset}`
const fixture = await fs.readFile('tests/fixtures/jfk.wav')
const browser = await chromium.launch(process.env.WHISP_BRAVE_EXECUTABLE ? { executablePath: process.env.WHISP_BRAVE_EXECUTABLE } : {})
try {
  const page = await browser.newPage()
  const external = []
  page.context().on('request', request => { if (new URL(request.url()).origin !== new URL(base).origin) external.push(request.url()) })
  page.on('pageerror', error => console.log('Runtime:', error.message))
  page.on('response', response => { if (response.status() >= 400) console.log('Asset:', response.status(), response.url()) })
  page.on('console', message => { if (message.type() === 'error') console.log('Browser:', message.text()) })
  const headersFile = await fs.readFile('public/_headers', 'utf8')
  const policy = headersFile.split('\n').find(line => line.includes('Content-Security-Policy:')).split('Content-Security-Policy:')[1].trim()
  await page.route('**/*', async route => {
    const request = route.request()
    if (request.resourceType() === 'document' || new URL(request.url()).pathname.includes('/assets/speech.worker-')) {
      const response = await route.fetch()
      await route.fulfill({ response, headers: { ...response.headers(), 'Content-Security-Policy': policy } })
    } else await route.continue()
  })
  await page.goto(base)
  const result = await page.evaluate(async ({ base64, workerPath }) => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const context = new OfflineAudioContext(1, 16000, 16000)
    const decoded = await context.decodeAudioData(bytes.buffer)
    const audio = decoded.getChannelData(0)
    const worker = new Worker(workerPath, { type: 'module' })
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Local voice timeout')) }, 120000)
      worker.onerror = event => { clearTimeout(timeout); worker.terminate(); reject(new Error(event.message)) }
      worker.onmessage = event => {
        if (event.data.type === 'ready') worker.postMessage({ type: 'transcribe', id: 0, audio: new Float32Array(16000), sampleRate: 16000 })
        if (event.data.type === 'result' && event.data.id === 0) {
          if (event.data.text !== '') { clearTimeout(timeout); worker.terminate(); reject(new Error('Silence became writing')); return }
          worker.postMessage({ type: 'transcribe', id: 1, audio, sampleRate: decoded.sampleRate }, [audio.buffer]); return
        }
        if (event.data.type === 'result' || event.data.type === 'error') { clearTimeout(timeout); worker.terminate(); resolve(event.data) }
      }
      worker.postMessage({ type: 'load' })
    })
  }, { base64: fixture.toString('base64'), workerPath })
  if (result.type !== 'result' || !/country/i.test(result.text)) throw new Error(`Local speech verification failed: ${JSON.stringify(result)}`)
  if (external.length) throw new Error('Speech attempted an external request')
  console.log('Real local speech model rejected silence and recognized the public test fixture under the production CSP, with no external requests. No physical microphone or cloud transcription was used.')
} finally { await browser.close() }
