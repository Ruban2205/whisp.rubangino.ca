import { test, expect, type Page } from '@playwright/test'
async function mockMicrophone(page: Page, pending = false) {
  await page.addInitScript(({ pending }) => {
    const controls = { stops: 0, closes: 0, breath: false, resolve: null as null | (() => void), disconnected: null as null | (() => void), hidden: false }
    Object.assign(window, { audioTest: controls })
    const track = { stop: () => controls.stops++, onended: null as null | (() => void) }
    controls.disconnected = () => track.onended?.()
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => pending ? new Promise(resolve => { controls.resolve = () => resolve(stream) }) : Promise.resolve(stream) } })
    class FakeContext {
      sampleRate = 48000; state = 'running'; onstatechange = null
      resume() { return Promise.resolve() }
      close() { this.state = 'closed'; controls.closes++; return Promise.resolve() }
      createMediaStreamSource() { return { connect() {}, disconnect() {} } }
      createAnalyser() {
        return { fftSize: 2048, smoothingTimeConstant: 0.25, frequencyBinCount: 1024, disconnect() {},
          getFloatTimeDomainData(data: Float32Array) { const amplitude = controls.breath ? 0.06 : 0.002; for (let i = 0; i < data.length; i++) data[i] = (i % 2 ? 1 : -1) * amplitude },
          getFloatFrequencyData(data: Float32Array) { data.fill(-40) },
        }
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: FakeContext })
    Object.defineProperty(document, 'hidden', { get: () => controls.hidden })
  }, { pending })
}
async function write(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await page.getByRole('textbox').fill('These words stay until I am ready.')
}
const audioControls = () => (window as unknown as { audioTest: { stops: number; closes: number; breath: boolean; resolve: () => void; disconnected: () => void; hidden: boolean } }).audioTest

test('mocked sustained breath releases once and cleans up the audio resources', async ({ page }) => {
  await mockMicrophone(page); await write(page)
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Listening. Blow gently')
  // Ordinary calibrated noise does not erase anything.
  await expect(page.getByRole('textbox')).toHaveValue('These words stay until I am ready.')
  await page.evaluate(() => { (window as unknown as { audioTest: { breath: boolean } }).audioTest.breath = true })
  await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()
  expect(await page.evaluate(`(${audioControls})().stops`)).toBe(1)
  expect(await page.evaluate(`(${audioControls})().closes`)).toBe(1)
  await page.getByRole('button', { name: /Bring it back/ }).click()
  await expect(page.getByRole('textbox')).toHaveValue('These words stay until I am ready.')
})
test('stopping before permission resolves disposes the eventual stream', async ({ page }) => {
  await mockMicrophone(page, true); await write(page)
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Allow the microphone')
  await page.getByRole('button', { name: 'Stop listening' }).click()
  await page.evaluate(`(${audioControls})().resolve()`)
  await expect(page.getByRole('button', { name: 'Use my breath' })).toBeVisible()
  await expect.poll(() => page.evaluate(`(${audioControls})().stops`)).toBe(1)
  expect(await page.evaluate(`(${audioControls})().closes`)).toBe(0)
})
test('hidden tabs stop listening; disconnect errors retain writing', async ({ page }) => {
  await mockMicrophone(page); await write(page)
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('finding the room')
  await page.evaluate(`(${audioControls})().hidden = true; document.dispatchEvent(new Event('visibilitychange'))`)
  await expect(page.getByRole('button', { name: 'Use my breath' })).toBeVisible()
  expect(await page.evaluate(`(${audioControls})().stops`)).toBe(1)
  await page.evaluate(`(${audioControls})().hidden = false; document.dispatchEvent(new Event('visibilitychange'))`)
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('finding the room')
  await page.evaluate(`(${audioControls})().disconnected()`)
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('disconnected')
  await expect(page.getByRole('textbox')).toHaveValue('These words stay until I am ready.')
})
test('undo expires from application state after twenty seconds', async ({ page }) => {
  await write(page)
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.getByRole('button', { name: /Bring it back/ })).toBeVisible()
  await page.clock.install()
  await page.clock.fastForward(21000)
  await expect(page.getByRole('button', { name: /Bring it back/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Begin again' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('')
  await page.getByRole('textbox').press('ControlOrMeta+z')
  await expect(page.getByRole('textbox')).toHaveValue('')
})
