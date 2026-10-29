import { chromium, firefox, webkit, expect } from '@playwright/test'
import fs from 'node:fs/promises'
const baseURL = process.env.WHISP_PREVIEW_URL || 'http://127.0.0.1:4173'
const engines = { chromium, firefox, webkit }
const engine = process.env.WHISP_BROWSER || 'chromium'
if (!(engine in engines)) throw new Error(`Unsupported smoke browser: ${engine}`)
const browser = await engines[engine].launch()
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const errors = [], external = [], failed = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url()) })
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
  const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'))
  await page.route('**/*', async route => {
    const response = await route.fetch()
    const headers = { ...response.headers(), ...Object.fromEntries(config.headers[0].headers.map(header => [header.key, header.value])) }
    await route.fulfill({ response, headers })
  })
  const response = await page.goto(baseURL)
  expect(response.status()).toBe(200)
  await expect(page).toHaveTitle('Whisp — Private Online Notebook to Write & Let Go')
  for (const asset of ['/favicon.svg', '/favicon.ico', '/favicon-48.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/site.webmanifest', '/og-image.png', '/robots.txt', '/sitemap.xml']) {
    expect((await page.request.get(`${baseURL}${asset}`)).status()).toBe(200)
  }
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await page.getByRole('textbox').fill('A production smoke test.\n世界 🌙')
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()
  await page.getByRole('button', { name: /Bring it back/ }).click()
  await expect(page.getByRole('textbox')).toHaveValue('A production smoke test.\n世界 🌙')
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))
  expect(storage).toEqual({ local: 0, session: 0, cookie: '' })
  expect(errors).toEqual([]); expect(external).toEqual([]); expect(failed).toEqual([])
  await expect(page.locator('h1')).toHaveCount(1)
  const readOnly = await browser.newContext({ javaScriptEnabled: false })
  const noJs = await readOnly.newPage()
  await noJs.goto(baseURL)
  await expect(noJs.getByRole('heading', { level: 1 })).toContainText('set your thoughts down')
  await expect(noJs.locator('.javascript-notice')).toContainText('Enable JavaScript')
  await expect(noJs.getByRole('link', { name: /Ruban AI Labs/ }).last()).toHaveAttribute('href', 'https://labs.rubangino.ca/')
  await readOnly.close()
  console.log(engine + ' production smoke passed: pre-rendered/no-JS landing, hydration under CSP, mobile writing/release/undo, metadata/assets, no runtime errors, no third-party requests, and no persistent writing storage.')
} finally { await browser.close() }
