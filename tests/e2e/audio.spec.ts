import { test, expect, type Page } from '@playwright/test'
async function mockMicrophone(page: Page, pending = false) {
  await page.addInitScript(({ pending }) => {
    const controls = { stops: 0, closes: 0, breath: false, wind: false, resolve: null as null | (() => void), disconnected: null as null | (() => void), hidden: false, calls: 0 }
    Object.assign(window, { audioTest: controls })
    const track = { stop: () => controls.stops++, onended: null as null | (() => void) }
    controls.disconnected = () => track.onended?.()
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
    const NativeAudio = window.AudioContext
    let lastContext: MockContext | undefined
    class MockContext extends NativeAudio {
      microphone = false
      constructor() { super(); lastContext = this }
      close() { if (this.microphone) controls.closes++; return super.close() }
      createMediaStreamSource(input: MediaStream): MediaStreamAudioSourceNode {
        if (input as unknown !== stream) return super.createMediaStreamSource(input)
        return { disconnect() {}, connect(analyser: AnalyserNode) {
          let seed = 31, filtered = 0
          analyser.getFloatTimeDomainData = (data: Float32Array) => {
            const amplitude = controls.breath ? 0.014 : 0.001
            for (let i = 0; i < data.length; i++) {
              seed = seed * 16807 % 2147483647
              const noise = seed / 2147483647 * 2 - 1
              filtered = filtered * 0.45 + noise * 0.55
              data[i] = (controls.wind ? filtered * 2 : noise) * amplitude
            }
          }
          analyser.getFloatFrequencyData = (data: Float32Array) => {
            data.fill(controls.wind ? -75 : -40)
            if (controls.wind) for (let i = 2; i < 22; i++) data[i] = -28 - i * 0.4
          }
        } } as unknown as MediaStreamAudioSourceNode
      }
    }
    Object.defineProperty(window, 'AudioContext', { value: MockContext })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => {
      controls.calls++
      if (lastContext) lastContext.microphone = true
      return pending ? new Promise(resolve => { controls.resolve = () => resolve(stream) }) : Promise.resolve(stream)
    } } })
    Object.defineProperty(document, 'hidden', { get: () => controls.hidden })
  }, { pending })
}
async function write(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await page.getByRole('textbox').fill('These words stay until I am ready.')
}
const audioControls = () => (window as unknown as { audioTest: { stops: number; closes: number; breath: boolean; wind: boolean; calls: number; resolve: () => void; disconnected: () => void; hidden: boolean } }).audioTest

for (const wind of [false, true]) {
  test(`default microphone releases sustained ${wind ? 'low-frequency wind' : 'soft broadband breath'} and cleans up`, async ({ page }) => {
    await mockMicrophone(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('checkbox', { name: 'Microphone on when you enter' })).toBeChecked()
    expect(await page.evaluate(`(${audioControls})().calls`)).toBe(0)
    await page.getByRole('button', { name: 'Enter your space' }).click()
    await page.getByRole('textbox').fill('These words stay until I am ready.')
    await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Listening. Blow gently')
    await expect(page.getByRole('textbox')).toHaveValue('These words stay until I am ready.')
    await page.evaluate(`(${audioControls})().wind = ${wind}; (${audioControls})().breath = true`)
    await expect(page.getByRole('button', { name: 'Begin again' })).toBeVisible()
    expect(await page.evaluate(`(${audioControls})().stops`)).toBe(1)
    expect(await page.evaluate(`(${audioControls})().closes`)).toBe(1)
    await page.getByRole('button', { name: /Bring it back/ }).click()
    await expect(page.getByRole('textbox')).toHaveValue('These words stay until I am ready.')
  })
}
test('stopping before permission resolves disposes the eventual stream and context', async ({ page }) => {
  await mockMicrophone(page, true); await write(page)
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Allow the microphone')
  await page.getByRole('button', { name: 'Stop listening' }).click()
  await page.evaluate(`(${audioControls})().resolve()`)
  await expect(page.getByRole('button', { name: 'Use my breath' })).toBeVisible()
  await expect.poll(() => page.evaluate(`(${audioControls})().stops`)).toBe(1)
  expect(await page.evaluate(`(${audioControls})().closes`)).toBe(1)
})
test('hidden tabs stop listening; disconnect errors retain writing', async ({ page }) => {
  await mockMicrophone(page); await write(page)
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
test('empty writing is never released; input feedback and sensitivity are usable', async ({ page }) => {
  await mockMicrophone(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Write something first')
  await page.evaluate(`(${audioControls})().breath = true`)
  await expect.poll(() => page.getByRole('meter', { name: 'Microphone input level' }).getAttribute('aria-valuenow')).not.toBe('0')
  await page.waitForTimeout(1000)
  await expect(page.getByRole('button', { name: 'Begin again' })).toHaveCount(0)
  await page.getByText('Microphone not responding?', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Breath sensitivity' }).selectOption('gentle')
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('finding the room')
  await page.evaluate(`(${audioControls})().breath = false`)
  await page.getByRole('button', { name: 'Recalibrate' }).click()
  await expect.poll(() => page.evaluate(`(${audioControls})().stops`)).toBe(1)
})
test('microphone opt-out is respected across entry and beginning again', async ({ page }) => {
  await mockMicrophone(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await page.getByRole('textbox').fill('A quiet option.')
  expect(await page.evaluate(`(${audioControls})().calls`)).toBe(0)
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await page.getByRole('button', { name: 'Begin again' }).click()
  expect(await page.evaluate(`(${audioControls})().calls`)).toBe(0)
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
