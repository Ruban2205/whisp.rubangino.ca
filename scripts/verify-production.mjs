import { chromium, expect } from '@playwright/test'
const baseURL = process.env.WHISP_PREVIEW_URL || 'http://127.0.0.1:4173'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const errors = [], external = [], failed = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL).origin) external.push(request.url()) })
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
  const response = await page.goto(baseURL)
  expect(response.status()).toBe(200)
  await expect(page).toHaveTitle('Whisp — Write It. Breathe It Out. Let It Go.')
  for (const asset of ['/favicon.svg', '/og-image.png', '/robots.txt', '/sitemap.xml']) {
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
  console.log('Production smoke passed: mobile writing/release/undo, metadata/assets, no runtime errors, no third-party requests, and no persistent storage.')
} finally { await browser.close() }
