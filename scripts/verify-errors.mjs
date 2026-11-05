import { chromium, firefox, webkit, expect } from '@playwright/test'
import fs from 'node:fs/promises'
const baseURL = process.env.WHISP_PREVIEW_URL || 'http://127.0.0.1:4173'
const engine = process.env.WHISP_BROWSER || 'chromium'
const engines = { chromium, firefox, webkit }
if (!(engine in engines)) throw new Error(`Unsupported browser: ${engine}`)
const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'))
const security = Object.fromEntries(config.headers[0].headers.map(header => [header.key, header.value]))
const browser = await engines[engine].launch()
try {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await context.newPage()
  for (const path of ['/', '/about/', '/how-it-works/']) {
    expect((await staticPage.goto(baseURL + path)).status()).toBe(200)
    await expect(staticPage.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(staticPage.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://whisp.rubangino.ca' + path)
    await expect(staticPage.getByRole('link', { name: /Ruban Gino Singh/ }).first()).toBeVisible()
  }
  expect((await staticPage.goto(baseURL + '/this-page-does-not-exist')).status()).toBe(404)
  await expect(staticPage.getByRole('heading', { name: 'Some stars are still undiscovered.' })).toBeVisible()
  await staticPage.getByRole('link', { name: /Return to the stars/ }).click()
  await expect(staticPage.getByRole('heading', { level: 1 })).toContainText('set your thoughts down')
  for (const path of ['/errors', '/errors/', '/errors/index.html', '/errors/voice/', '/errors/runtime/', '/errors/offline/', '/offline.html', '/startup.html', '/branding/', '/docs/ERROR_PAGES.md', '/README.md']) {
    expect((await staticPage.goto(baseURL + path)).status(), `${path} must not publish developer content`).toBe(404)
    await expect(staticPage.getByRole('heading', { name: 'Some stars are still undiscovered.' })).toBeVisible()
    await expect(staticPage.locator('.error-gallery')).toHaveCount(0)
  }
  await context.close()

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const runtimeErrors = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  await page.route('**/*', async route => {
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), ...security } })
  })
  for (const path of ['/404.html', '/500.html']) {
    await page.goto(baseURL + path)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('.error-primary')).toBeVisible()
    await expect(page.locator('.error-content')).toHaveCSS('opacity', '1')
    expect(await page.locator('.error-orbit-core').evaluate(el => getComputedStyle(el).animationName)).toBe('error-core-breathe')
  }
  if (process.env.WHISP_SCREENSHOTS) {
    const folder = process.env.WHISP_SCREENSHOTS
    await fs.mkdir(folder, { recursive: true })
    await page.goto(baseURL + '/404.html')
    await expect(page.locator('.error-content')).toHaveCSS('opacity', '1')
    await page.screenshot({ path: `${folder}/error-desktop.png`, fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: `${folder}/error-mobile.png`, fullPage: true })
    await page.goto(baseURL + '/about/')
    await page.screenshot({ path: `${folder}/about-mobile.png`, fullPage: true })
  }
  expect(runtimeErrors).toEqual([])
  await page.close()

  // Reproduce the host-injected analytics script seen on the production domain.
  // CSP must block it without hiding the healthy application before hydration.
  const optional = await browser.newPage({ reducedMotion: 'reduce' })
  await optional.addInitScript(() => {
    window.whispCspBlocks = 0
    document.addEventListener('securitypolicyviolation', event => { if (event.blockedURI.startsWith('https://static.cloudflareinsights.com/')) window.whispCspBlocks++ })
  })
  await optional.route('**/*', async route => {
    const response = await route.fetch()
    const headers = { ...response.headers(), ...security }
    if (route.request().isNavigationRequest() && new URL(route.request().url()).pathname === '/') {
      const body = (await response.text()).replace('</head>', '<script src="https://static.cloudflareinsights.com/beacon.min.js" defer></script></head>')
      await route.fulfill({ response, headers, body })
    } else await route.fulfill({ response, headers })
  })
  await optional.goto(baseURL)
  await expect(optional.getByRole('checkbox', { name: 'Microphone on when you enter' })).toBeVisible()
  await expect(optional.locator('#startup-error')).toBeHidden()
  await expect.poll(() => optional.evaluate(() => window.whispCspBlocks)).toBeGreaterThan(0)
  await optional.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await optional.getByRole('button', { name: 'Enter your space' }).click()
  await optional.getByRole('textbox').fill('A blocked optional script cannot hide my page.')
  await expect(optional.getByRole('textbox')).toHaveValue('A blocked optional script cannot hide my page.')
  await optional.close()

  for (const resource of ['script', 'stylesheet']) {
    const startup = await browser.newPage()
    await startup.route('**/*', async route => {
      const request = route.request()
      if (request.resourceType() === resource && /\/assets\/index-/.test(request.url())) return route.abort('failed')
      const response = await route.fetch()
      await route.fulfill({ response, headers: { ...response.headers(), ...security } })
    })
    await startup.goto(baseURL)
    await expect(startup.locator('#startup-error')).toBeVisible()
    await expect(startup.locator('#root')).toBeHidden()
    await expect(startup.getByRole('heading', { name: 'Your space hasn’t opened yet.' })).toBeVisible()
    await expect(startup.getByRole('link', { name: 'Try this page again' })).toHaveAttribute('href', '')
    await startup.close()
  }
  console.log(`${engine}: production no-JS public pages, genuine HTTP 404, absent preview routes, CSS motion, blocked optional analytics with usable writing, and real startup failure recovery passed.`)
} finally { await browser.close() }
