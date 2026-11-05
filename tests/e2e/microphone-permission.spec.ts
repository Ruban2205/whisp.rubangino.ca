import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function microphoneHarness(page: Page) {
  await page.addInitScript(() => {
    const control = { calls: 0, stops: 0, workers: 0, allow: false, permission: 'prompt', unsupportedQuery: false, error: 'NotAllowedError', defer: false, reject: null as null | (() => void) }
    Object.assign(window, { permissionHarness: control })
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
    const track = { readyState: 'live', onended: null, stop() { this.readyState = 'ended'; control.stops++ } }
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: async () => {
      if (control.unsupportedQuery) throw new TypeError('Microphone query unsupported')
      return { state: control.permission }
    } } })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => {
      control.calls++
      if (control.defer) return new Promise((_resolve, reject) => { control.reject = () => reject(new DOMException('Blocked', 'NotAllowedError')) })
      if (!control.allow) throw new DOMException('Microphone unavailable', control.error)
      track.readyState = 'live'; return stream
    } } })
    const NativeAudio = window.AudioContext, NativeWorker = window.Worker
    class CaptureContext extends NativeAudio {
      createMediaStreamSource(input: MediaStream): MediaStreamAudioSourceNode {
        if (input as unknown === stream) return { connect() {}, disconnect() {} } as unknown as MediaStreamAudioSourceNode
        return super.createMediaStreamSource(input)
      }
    }
    class FakeWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null
      onerror = null
      postMessage(data: { type: string }) { if (data.type === 'load') queueMicrotask(() => this.onmessage?.({ data: { type: 'ready' } })) }
      terminate() {}
    }
    function WorkerRouter(url: string | URL, options: WorkerOptions) {
      if (String(url).includes('speech.worker')) { control.workers++; return new FakeWorker() }
      return new NativeWorker(url, options)
    }
    Object.defineProperty(window, 'AudioContext', { value: CaptureContext })
    Object.defineProperty(window, 'Worker', { value: WorkerRouter })
  })
}
async function open(page: Page, optOut = true) {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/')
  if (optOut) await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
}
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Microphone access is off.' })
const calls = (page: Page) => page.evaluate('(window.permissionHarness).calls')

test('entry denial opens an accessible modal without any microphone request on page load', async ({ page }) => {
  await microphoneHarness(page); await page.goto('/')
  expect(await calls(page)).toBe(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(dialog(page)).toBeVisible()
  await expect(page.locator('.stage-entering')).toBeAttached()
  expect(await calls(page)).toBe(1)
  await expect(dialog(page)).toContainText('Refreshing or closing it loses your writing')
  await page.getByRole('combobox', { name: 'Microphone help device' }).selectOption('ios')
  await expect(dialog(page)).toContainText('Privacy & Security')
  await page.getByRole('combobox', { name: 'Microphone help device' }).selectOption('android')
  await expect(dialog(page)).toContainText('Site settings')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Skip journey' }).click()
  await page.getByRole('textbox').fill('I can still write.')
  expect(await calls(page)).toBe(1)
})

test('continuing without access preserves the draft, manual release and microphone opt-out', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.getByRole('textbox').fill('These are still my words.')
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(dialog(page)).toBeVisible()
  await expect(page.locator('textarea')).toHaveValue('These are still my words.')
  await page.getByRole('button', { name: 'Keep writing without microphone' }).click()
  await expect(page.getByRole('textbox')).toBeFocused()
  await expect(page.getByRole('textbox')).toHaveValue('These are still my words.')
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await page.getByRole('button', { name: 'Begin again' }).click()
  await expect(page.getByRole('textbox')).toBeEditable()
  expect(await calls(page)).toBe(1)
  await expect(dialog(page)).toHaveCount(0)
})

test('retry succeeds after permission is enabled and keeps the same draft', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.getByRole('textbox').fill('A thought worth keeping.')
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(dialog(page)).toBeVisible()
  await page.evaluate('(window.permissionHarness).allow = true')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('status', { name: 'Microphone status' })).toContainText('Listening.')
  await expect(page.getByRole('textbox')).toHaveValue('A thought worth keeping.')
  expect(await calls(page)).toBe(2)
  await page.getByRole('button', { name: 'Stop listening' }).click()
  expect(await page.evaluate('(window.permissionHarness).stops')).toBe(1)
})

test('known blocked voice permission skips model loading and retry returns to voice input', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.getByRole('textbox').fill('My typed words stay.')
  await page.evaluate('(window.permissionHarness).permission = "denied"')
  await page.getByRole('button', { name: 'Speak your thoughts' }).click()
  await page.getByRole('button', { name: 'Enable private voice typing' }).click()
  await expect(dialog(page)).toBeVisible()
  expect(await page.evaluate('(window.permissionHarness).workers')).toBe(0)
  expect(await calls(page)).toBe(0)
  await page.evaluate('(window.permissionHarness).permission = "granted"; (window.permissionHarness).allow = true')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Finish voice typing' })).toBeVisible()
  expect(await calls(page)).toBe(1)
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('button', { name: 'Speak your thoughts' })).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveValue('My typed words stay.')
})

test('voice denial still opens help when microphone permission queries are unsupported', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.evaluate('(window.permissionHarness).unsupportedQuery = true')
  await page.getByRole('button', { name: 'Speak your thoughts' }).click()
  await page.getByRole('button', { name: 'Enable private voice typing' }).click()
  await expect(dialog(page)).toBeVisible()
  expect(await calls(page)).toBe(1)
  await page.getByRole('button', { name: 'Close microphone help' }).click()
  await expect(page.getByRole('textbox')).toBeEditable()
})

test('a missing device remains a device error rather than a false permission warning', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.evaluate('(window.permissionHarness).error = "NotFoundError"')
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await expect(page.getByRole('dialog', { name: 'The breeze couldn’t reach us.' })).toBeVisible()
  await expect(dialog(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Keep writing', exact: true }).click()
  await page.getByRole('textbox').fill('Still usable.')
})

test('a denied request arriving after Stop does not reopen microphone help', async ({ page }) => {
  await microphoneHarness(page); await open(page)
  await page.evaluate('(window.permissionHarness).defer = true')
  await page.getByRole('textbox').fill('Keep this page calm.')
  await page.getByRole('button', { name: 'Use my breath' }).click()
  await page.getByRole('button', { name: 'Stop listening' }).click()
  await page.evaluate('(window.permissionHarness).reject()')
  await expect(page.getByRole('button', { name: 'Use my breath' })).toBeVisible()
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('textbox')).toHaveValue('Keep this page calm.')
})

for (const [width, height] of [[280, 400], [390, 844], [568, 320]]) {
  test(`permission help actions remain reachable at ${width}×${height}`, async ({ page }) => {
    await microphoneHarness(page); await page.setViewportSize({ width, height }); await open(page, false)
    await expect(dialog(page)).toBeVisible()
    const box = (await dialog(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height)
    await page.getByRole('button', { name: 'Keep writing without microphone' }).click()
    await expect(page.getByRole('textbox')).toBeEditable()
  })
}
