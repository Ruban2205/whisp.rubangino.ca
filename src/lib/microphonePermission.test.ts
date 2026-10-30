import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMicrophonePermissionError, microphoneHelpDevice, microphonePermissionIsDenied } from './microphonePermission'

afterEach(() => vi.unstubAllGlobals())
describe('microphone permission recovery', () => {
  it('recognizes denied and policy-blocked access across DOM and plain error objects', () => {
    expect(isMicrophonePermissionError(new DOMException('', 'NotAllowedError'))).toBe(true)
    expect(isMicrophonePermissionError({ name: 'SecurityError' })).toBe(true)
    for (const value of [undefined, null, 'NotAllowedError', new DOMException('', 'NotFoundError'), new Error('model download failed')]) expect(isMicrophonePermissionError(value)).toBe(false)
  })
  it('recognizes an already denied permission without requesting microphone input', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'denied' })
    vi.stubGlobal('navigator', { permissions: { query } })
    expect(await microphonePermissionIsDenied()).toBe(true)
    expect(query).toHaveBeenCalledWith({ name: 'microphone' })
  })
  it('falls back to the real permission request when queries are unsupported', async () => {
    vi.stubGlobal('navigator', { permissions: { query: async () => { throw new TypeError('Unsupported descriptor') } } })
    expect(await microphonePermissionIsDenied()).toBe(false)
    vi.stubGlobal('navigator', {})
    expect(await microphonePermissionIsDenied()).toBe(false)
  })
  it('does not treat a first-time or allowed permission as a block', async () => {
    for (const state of ['prompt', 'granted']) {
      vi.stubGlobal('navigator', { permissions: { query: async () => ({ state }) } })
      expect(await microphonePermissionIsDenied()).toBe(false)
    }
  })
  it('suggests device help including iPad desktop browsing without assuming the browser', () => {
    expect(microphoneHelpDevice('iPhone Safari', 'iPhone', 5)).toBe('ios')
    expect(microphoneHelpDevice('Macintosh Safari', 'MacIntel', 5)).toBe('ios')
    expect(microphoneHelpDevice('Android Chrome', 'Linux', 5)).toBe('android')
    expect(microphoneHelpDevice('Macintosh Safari', 'MacIntel', 0)).toBe('computer')
  })
})
