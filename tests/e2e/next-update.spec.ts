import { test, expect, type Page } from '@playwright/test'

async function enter(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('textbox')).toBeEditable()
}
async function seedCache(page: Page) {
  await page.evaluate(async () => {
    await (await caches.open('whisp-voice-model-v1')).put('/public-model-fixture', new Response('public model only'))
    await caches.open('unrelated-test-cache')
  })
}
async function release(page: Page) {
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()
}

test('successful release clears only model cache automatically and leaves undo usable', async ({ page }) => {
  await enter(page); await seedCache(page)
  await page.getByRole('textbox').fill('Keep my words until release succeeds.')
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  expect(await page.evaluate(() => caches.has('whisp-voice-model-v1'))).toBe(true)
  await page.getByRole('button', { name: 'Or release with a swipe' }).click()
  await page.getByRole('button', { name: 'Keep writing' }).click()
  expect(await page.evaluate(() => caches.has('whisp-voice-model-v1'))).toBe(true)
  await release(page)
  await expect(page.locator('.cache-release-note')).toContainText('cleared automatically')
  expect(await page.evaluate(() => caches.has('whisp-voice-model-v1'))).toBe(false)
  expect(await page.evaluate(() => caches.has('unrelated-test-cache'))).toBe(true)
  await page.getByRole('button', { name: /Bring it back/ }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Keep my words until release succeeds.')
})

test('cache failures are explained without blocking release or restoring words', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'caches', { value: { delete: async () => { throw new Error('Storage restricted') } } }) })
  await enter(page)
  await page.getByRole('textbox').fill('I can still let this go.')
  await release(page)
  await expect(page.locator('.cache-release-note')).toContainText('could not be cleared')
  await page.getByRole('button', { name: /Bring it back/ }).click()
  await expect(page.getByRole('textbox')).toHaveValue('I can still let this go.')
})

test('empty notebook returns through reversed portal, clears model cache and restores home focus', async ({ page }) => {
  await enter(page); await seedCache(page)
  await expect(page.locator('#ritual-guide')).toContainText('take a slow breath and blow gently')
  await page.getByRole('textbox').fill('Protect an unfinished thought.')
  await expect(page.getByRole('button', { name: 'Whisp, return home' })).toHaveCount(0)
  await page.getByRole('textbox').fill('')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Whisp, return home' }).click()
  await expect(page.locator('.returning-journey.lifting')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip return' })).toBeFocused()
  await expect(page.locator('.returning-journey.receding')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enter your space' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Enter your space' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Enter your space' })).toBeFocused()
  await expect(page.locator('.returning-journey')).toHaveCount(0)
  expect(await page.evaluate(() => caches.has('whisp-voice-model-v1'))).toBe(false)
  expect(await page.evaluate(() => caches.has('unrelated-test-cache'))).toBe(true)
})

test('completion return supports skipping, drops undo and can enter again', async ({ page }) => {
  await enter(page)
  await page.getByRole('textbox').fill('One moment at a time.')
  await release(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('button', { name: 'Return to the stars' }).click()
  await expect(page.getByRole('button', { name: /Bring it back/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip return' }).click()
  await expect(page.getByRole('button', { name: 'Enter your space' })).toBeFocused()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('status', { name: 'Voice typing status' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Whisp, return home' }).click()
  await expect(page.getByRole('button', { name: 'Enter your space' })).toBeEnabled({ timeout: 1500 })
})

for (const [width, height] of [[280, 653], [320, 400], [568, 320], [844, 390], [600, 800], [1280, 720]]) {
  test(`guidance, voice notice, writing, help and return usable at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await enter(page)
    await page.getByRole('textbox').fill('A little space. '.repeat(60))
    await expect(page.locator('#ritual-guide')).toBeVisible()
    await page.getByRole('button', { name: 'Speak your thoughts' }).click()
    await expect(page.getByRole('button', { name: 'Enable private voice typing' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const bounds = await page.getByRole('button', { name: 'Enable private voice typing' }).boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: 'Not now' }).click()
    await page.getByRole('button', { name: 'Help and how your data is cleared' }).click()
    await page.getByRole('button', { name: 'Back to my space' }).click()
    await release(page)
    await page.getByRole('button', { name: 'Return to the stars' }).click()
    await expect(page.getByRole('button', { name: 'Enter your space' })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
