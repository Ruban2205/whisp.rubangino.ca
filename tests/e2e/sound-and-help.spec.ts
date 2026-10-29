import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('sound is selected by default, starts on entry, becomes notebook music, and mutes', async ({ page }) => {
  await page.addInitScript(() => {
    const stats = { contexts: 0, notes: 0, closes: 0 }
    Object.assign(window, { scoreTest: stats })
    const NativeAudio = window.AudioContext
    class TrackedAudio extends NativeAudio {
      constructor() { super(); stats.contexts++ }
      createOscillator() { stats.notes++; return super.createOscillator() }
      close() { stats.closes++; return super.close() }
    }
    Object.defineProperty(window, 'AudioContext', { value: TrackedAudio })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Sound on, turn ambient sound off' })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate('(window.scoreTest).contexts')).toBe(0)
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect.poll(() => page.evaluate('(window.scoreTest).notes')).toBeGreaterThan(10)
  await page.getByRole('button', { name: 'Skip journey' }).click()
  await expect.poll(() => page.evaluate('(window.scoreTest).notes')).toBeGreaterThan(24)
  await page.getByRole('button', { name: 'Sound on, turn ambient sound off' }).click()
  await expect(page.getByRole('button', { name: 'Sound off, turn ambient sound on' })).toBeVisible()
  expect(await page.evaluate('(window.scoreTest).closes')).toBe(1)
  await page.getByRole('button', { name: 'Sound off, turn ambient sound on' }).click()
  await expect.poll(() => page.evaluate('(window.scoreTest).contexts')).toBe(2)
})

test('muting before entry is respected throughout the notebook', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Sound on, turn ambient sound off' }).click()
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('textbox')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sound off, turn ambient sound on' })).toHaveAttribute('aria-pressed', 'false')
})

test('entry chime and notebook score render audible, bounded original audio', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const modulePath = '/src/lib/soundscape.ts'
    const { Soundscape } = await import(modulePath)
    const results = []
    for (const scene of ['journey', 'notebook', 'ducked']) {
      const context = new OfflineAudioContext(2, 16000 * 5, 16000)
      const score = new Soundscape(context)
      if (scene === 'journey') score.playJourney(); else { score.startNotebook(); if (scene === 'ducked') score.setListening(true, true) }
      const buffer = await context.startRendering()
      score.dispose()
      const data = buffer.getChannelData(0)
      let sum = 0, peak = 0
      for (const value of data) { sum += value * value; peak = Math.max(peak, Math.abs(value)) }
      results.push({ rms: Math.sqrt(sum / data.length), peak })
    }
    return results
  })
  for (const result of results.slice(0, 2)) { expect(result.rms).toBeGreaterThan(0.001); expect(result.peak).toBeLessThan(0.3) }
  expect(results[2].rms).toBeLessThan(results[1].rms * 0.1)
})

test('Help explains memory, no storage, clearing, and microphone permission accessibly', async ({ page }) => {
  await page.goto('/')
  const help = page.getByRole('button', { name: 'Help and how your data is cleared' })
  await help.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('temporary memory')
  await expect(dialog).toContainText('We do not put it in local storage')
  await expect(dialog).toContainText('20 seconds')
  await expect(dialog).toContainText('Refresh or close this page')
  await expect(dialog).toContainText('never recorded or uploaded')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(help).toBeFocused()
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))).toEqual({ local: 0, session: 0, cookie: '' })
})
