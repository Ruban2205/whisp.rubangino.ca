import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs/promises'

async function enter(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.getByRole('textbox')).toBeEditable()
}
async function harness(page: Page, realModel = false) {
  await page.addInitScript(({ realModel }) => {
    const control = { node: null as AudioWorkletNode | null, stops: 0, terminated: 0, loads: 0, defer: false, pending: 0, worker: null as FakeWorker | null, requests: 0, transcript: 'I feel worried and anxious, but I can take one step.' }
    Object.assign(window, { voiceHarness: control })
    const track = { readyState: 'live', stop() { if (this.readyState !== 'ended') control.stops++; this.readyState = 'ended' }, onended: null }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { control.requests++; track.readyState = 'live'; return stream } } })
    const NativeAudio = window.AudioContext, NativeNode = window.AudioWorkletNode, NativeWorker = window.Worker
    class CaptureContext extends NativeAudio {
      createMediaStreamSource(input: MediaStream): MediaStreamAudioSourceNode {
        if (input as unknown === stream) return { connect() {}, disconnect() {} } as unknown as MediaStreamAudioSourceNode
        return super.createMediaStreamSource(input)
      }
    }
    class CaptureNode extends NativeNode {
      constructor(context: BaseAudioContext, name: string) { super(context, name); control.node = this }
    }
    class FakeWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null
      onerror = null
      postMessage(data: { type: string; id: number }) {
        if (data.type === 'load') { control.loads++; queueMicrotask(() => this.onmessage?.({ data: { type: 'ready' } })) }
        if (data.type === 'transcribe') { control.pending = data.id; if (!control.defer) setTimeout(() => this.result(), 30) }
      }
      result() { this.onmessage?.({ data: { type: 'result', id: control.pending, text: control.transcript } }) }
      terminate() { control.terminated++ }
    }
    function WorkerRouter(url: string | URL, options: WorkerOptions) {
      if (String(url).includes('speech.worker') && !realModel) { const worker = new FakeWorker(); control.worker = worker; return worker }
      return new NativeWorker(url, options)
    }
    Object.defineProperty(window, 'AudioContext', { value: CaptureContext })
    Object.defineProperty(window, 'AudioWorkletNode', { value: CaptureNode })
    Object.defineProperty(window, 'Worker', { value: WorkerRouter })
  }, { realModel })
}
async function feedPhrase(page: Page) {
  await page.evaluate(() => {
    const node = (window as unknown as { voiceHarness: { node: AudioWorkletNode } }).voiceHarness.node
    for (let block = 0; block < 24; block++) {
      const audio = new Float32Array(2048)
      if (block < 16) for (let i = 0; i < audio.length; i++) audio[i] = Math.sin((block * 2048 + i) * Math.PI * 2 * 220 / 16000) * 0.06
      node.port.dispatchEvent(new MessageEvent('message', { data: { audio, sampleRate: 16000 } }))
    }
  })
}
async function enable(page: Page) {
  await page.getByRole('button', { name: 'Speak your thoughts' }).click()
  await page.getByRole('button', { name: 'Enable private voice typing' }).click()
  await expect(page.getByRole('button', { name: 'Finish voice typing' })).toBeVisible({ timeout: 90000 })
}

test('voice consent, append, release, contextual positive note, undo, and rotation', async ({ page }) => {
  await harness(page); await enter(page)
  await page.getByRole('textbox').fill('My own typed words.')
  await page.getByRole('button', { name: 'Speak your thoughts' }).click()
  await expect(page.getByRole('region', { name: 'Private voice typing' })).toContainText('never uploaded')
  expect(await page.evaluate('(window.voiceHarness).loads')).toBe(0)
  expect(await page.evaluate('(window.voiceHarness).requests')).toBe(0)
  await page.getByRole('button', { name: 'Enable private voice typing' }).click()
  await expect(page.getByRole('button', { name: 'Finish voice typing' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeDisabled()
  await feedPhrase(page)
  await expect(page.getByRole('textbox')).toHaveValue('My own typed words. I feel worried and anxious, but I can take one step.')
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeEnabled()
  expect(await page.evaluate('(window.voiceHarness).stops')).toBe(1)
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.locator('.supportive-quote')).toBeVisible()
  await expect(page.locator('.supportive-quote')).toHaveAttribute('data-theme', 'worry')
  const first = await page.locator('.supportive-quote').textContent()
  await page.getByRole('button', { name: /Bring it back/ }).click()
  await expect(page.getByRole('textbox')).toHaveValue('My own typed words. I feel worried and anxious, but I can take one step.')
  await page.getByRole('button', { name: 'Let it go', exact: true }).click()
  await page.getByRole('button', { name: 'Yes, let it go' }).click()
  await expect(page.locator('.supportive-quote')).toBeVisible()
  await expect(page.locator('.supportive-quote')).not.toHaveText(first!)
})

test('finishing waits for pending recognition; cancel cleans up and preserves writing', async ({ page }) => {
  await harness(page); await enter(page)
  await page.getByRole('textbox').fill('Preserve my writing.')
  await page.evaluate('(window.voiceHarness).defer = true')
  await enable(page); await feedPhrase(page)
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('status', { name: 'Voice typing status' })).toContainText('Finishing')
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeDisabled()
  await page.evaluate('(window.voiceHarness).worker.result()')
  await expect(page.getByRole('textbox')).toHaveValue(/Preserve my writing. I feel worried/)
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeEnabled()
  await enable(page)
  await page.getByRole('button', { name: 'Cancel voice typing' }).click()
  await expect(page.getByRole('textbox')).toHaveValue(/Preserve my writing. I feel worried/)
  expect(await page.evaluate('(window.voiceHarness).stops')).toBe(2)
  expect(await page.evaluate('(window.voiceHarness).terminated')).toBe(2)
})

test('unsupported private voice input leaves keyboard writing usable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioWorkletNode', { value: undefined }) })
  await enter(page)
  await page.getByRole('textbox').fill('Still my words.')
  await page.getByRole('button', { name: 'Speak your thoughts' }).click()
  await page.getByRole('button', { name: 'Enable private voice typing' }).click()
  await expect(page.getByRole('status', { name: 'Voice typing status' })).toContainText('isn’t available')
  await expect(page.getByRole('textbox')).toHaveValue('Still my words.')
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeEnabled()
})

for (const [width, height] of [[320, 568], [375, 667], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  test(`home fits ${width}×${height} including navigation and footer`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    for (const role of ['Enter your space', 'Help and how your data is cleared']) {
      const box = (await page.getByRole('button', { name: role }).boundingBox())!
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1)
    }
    const notice = (await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).boundingBox())!
    expect(notice.y + notice.height).toBeLessThan(height - 30)
  })
}

test('notebook exists under the portal before arrival and stays in place after reveal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.getByRole('checkbox', { name: 'Microphone on when you enter' }).uncheck()
  await page.getByRole('button', { name: 'Enter your space' }).click()
  await expect(page.locator('.notebook-docking .notebook-paper')).toBeAttached({ timeout: 10000 })
  const before = (await page.locator('.notebook-paper').boundingBox())!
  await expect(page.locator('.journey.docking')).toBeVisible()
  await expect(page.getByRole('textbox')).toBeEditable({ timeout: 5000 })
  const after = (await page.locator('.notebook-paper').boundingBox())!
  expect(Math.abs(before.y - after.y)).toBeLessThan(2)
  expect(Math.abs(before.width - after.width)).toBeLessThan(2)
  await expect(page.locator('.journey')).toHaveCount(0)
})

test('real local speech model appends a public fixture into the editor', async ({ page }, testInfo) => {
  test.skip(!['brave', 'chromium'].includes(testInfo.project.name), 'Real CPU inference is verified in the Chromium family, including Brave; other engines run the capture/UI cases.')
  test.setTimeout(120000)
  await harness(page, true)
  await enter(page)
  await page.getByRole('textbox').fill('A note before speaking.')
  await enable(page)
  const fixture = await fs.readFile('tests/fixtures/jfk.wav')
  await page.evaluate(async base64 => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const context = new OfflineAudioContext(1, 16000, 16000)
    const decoded = await context.decodeAudioData(bytes.buffer)
    const samples = decoded.getChannelData(0)
    const node = (window as unknown as { voiceHarness: { node: AudioWorkletNode } }).voiceHarness.node
    for (let i = 0; i < samples.length; i += 2048) node.port.dispatchEvent(new MessageEvent('message', { data: { audio: samples.slice(i, i + 2048), sampleRate: 16000 } }))
  }, fixture.toString('base64'))
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('textbox')).toHaveValue(/A note before speaking\..*country/i, { timeout: 90000 })
  await expect(page.getByRole('button', { name: 'Let it go', exact: true })).toBeEnabled()
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
})


test('voice annotations never enter the draft; meaningful speech and typed labels remain', async ({ page }) => {
  await harness(page); await enter(page)
  await page.getByRole('textbox').fill('Music. Blank Audio. These are my typed words.')
  await page.evaluate('(window.voiceHarness).transcript = "[BLANK_AUDIO] (Music)"')
  await enable(page); await feedPhrase(page)
  await expect.poll(() => page.evaluate('(window.voiceHarness).pending')).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('button', { name: 'Speak your thoughts' })).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveValue('Music. Blank Audio. These are my typed words.')
  await page.evaluate('(window.voiceHarness).transcript = "[Music] Music helps me feel calm. I am crying because I miss someone. [Silence]"')
  await enable(page); await feedPhrase(page)
  await page.getByRole('button', { name: 'Finish voice typing' }).click()
  await expect(page.getByRole('textbox')).toHaveValue('Music. Blank Audio. These are my typed words. Music helps me feel calm. I am crying because I miss someone.')
})
