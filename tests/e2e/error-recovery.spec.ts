import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function write(page: Page, reduced = true) {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  if (!reduced) await page.getByRole('button', { name: 'Skip journey' }).click()
  await page.getByRole('textbox').fill('Synthetic recovery text.\n世界 🌙')
}

test('unexpected asynchronous errors return to the same writing without reloading', async ({ page }) => {
  await write(page)
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'Synthetic test failure' })))
  const recovery = page.getByRole('dialog', { name: 'The breeze paused.' })
  await expect(recovery).toBeVisible()
  await expect(page.getByRole('button', { name: 'Return to my page' })).toBeFocused()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Return to my page' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Synthetic recovery text.\n世界 🌙')
  await expect(page.getByRole('textbox')).toBeFocused()
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0])
})

test('offline interruption preserves the page and allows local writing', async ({ page, context }) => {
  await write(page)
  await context.setOffline(true)
  await expect(page.getByRole('dialog', { name: 'A quiet moment offline.' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep writing offline' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Synthetic recovery text.\n世界 🌙')
  await page.getByRole('textbox').fill('Still writing without a connection.')
  await context.setOffline(false)
  await expect(page.getByRole('textbox')).toHaveValue('Still writing without a connection.')
})

test('a React render failure offers the last committed draft and restores it in memory', async ({ page }) => {
  await write(page)
  // Inject a real render failure without a production-only test route or a saved draft.
  await page.evaluate(() => {
    const trim = String.prototype.trim
    Object.assign(window, { renderFault: true })
    String.prototype.trim = function () {
      if ((window as unknown as { renderFault: boolean }).renderFault && String(this).startsWith('Synthetic recovery text.')) throw new Error('Synthetic render failure')
      return trim.call(this)
    }
  })
  await page.getByRole('button', { name: 'Sound on, turn ambient sound off' }).click()
  await expect(page.getByRole('heading', { name: 'The breeze paused.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The breeze paused.' })).toBeFocused()
  await page.getByText('View my writing', { exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Last available writing' })).toHaveValue('Synthetic recovery text.\n世界 🌙')
  await page.evaluate(() => Object.assign(window, { renderFault: false }))
  await page.getByRole('button', { name: 'Restore my page' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Synthetic recovery text.\n世界 🌙')
  await expect(page.getByRole('button', { name: 'Use my breath' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume sound' })).toBeVisible()
})

test('a failed ink snapshot restores the editor rather than clearing its words', async ({ page }) => {
  await write(page, false)
  await page.evaluate(() => { CanvasRenderingContext2D.prototype.getImageData = () => { throw new Error('Synthetic canvas failure') } })
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.getByRole('dialog', { name: 'The breeze needs a moment.' })).toBeVisible()
  await page.getByRole('button', { name: 'Return to my writing' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Synthetic recovery text.\n世界 🌙')
  await expect(page.getByRole('textbox')).toBeEditable()
})

test('sound failure can be dismissed into a quiet usable notebook', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: class { constructor() { throw new Error('Synthetic audio failure') } } }) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('dialog', { name: 'The sound drifted away.' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue quietly' }).click()
  await page.getByRole('textbox').fill('Quiet is comfortable, too.')
  await expect(page.getByRole('button', { name: 'Sound off, turn ambient sound on' })).toBeVisible()
})

test('public developer and guide pages have unique metadata and accessible content', async ({ page }) => {
  for (const path of ['/about/', '/how-it-works/']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://whisp.rubangino.ca${path}`)
    await expect(page.getByRole('link', { name: 'Ruban Gino Singh', exact: true }).first()).toHaveAttribute('href', 'https://www.rubangino.ca/')
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  }
})

test('simultaneous sound and permission failures show one recovery dialog at a time', async ({ page }) => {
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume
    let calls = 0
    AudioContext.prototype.resume = function () { return ++calls === 1 ? Promise.reject(new Error('Synthetic sound failure')) : resume.call(this) }
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { throw new DOMException('Denied', 'NotAllowedError') } } })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('dialog', { name: 'Microphone access is off.' })).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Keep writing without microphone' }).click()
  await expect(page.getByRole('dialog', { name: 'The sound drifted away.' })).toBeVisible()
  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Continue quietly' }).click()
  await page.getByRole('textbox').fill('I can keep writing.')
})

test('local error gallery links to each design', async ({ page }) => {
  await page.goto('/errors/')
  await expect(page.locator('.error-gallery')).toBeVisible()
  const links = await page.locator('.error-gallery-grid > a').evaluateAll(elements => elements.map(el => el.getAttribute('href')!))
  expect(links).toHaveLength(14)
  for (const href of links) {
    await page.goto(href)
    await expect(page.locator('.error-space')).toHaveCount(1)
    const kind = href.replace(/^\/errors\//, '').replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '')
    await expect(page.locator('.error-space')).toHaveAttribute('data-error-kind', kind)
  }
})

test('all error designs have accessible actions, noindex, and responsive motion', async ({ page }) => {
  test.setTimeout(120000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['/403.html', '/404.html', '/408.html', '/429.html', '/500.html', '/503.html', '/504.html', '/offline.html', '/startup.html', '/errors/runtime/', '/errors/voice/', '/errors/microphone/', '/errors/release/', '/errors/audio/']) {
    await page.goto(path)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('.error-primary')).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    for (const width of [280, 390, 1440]) {
      await page.setViewportSize({ width, height: 600 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    expect(await page.locator('.error-orbit-core').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  }
})
