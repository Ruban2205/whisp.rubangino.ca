export type MicrophoneHelpTarget = 'breath' | 'voice'
export type MicrophoneHelpDevice = 'ios' | 'android' | 'computer'

export function isMicrophonePermissionError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('name' in error)) return false
  return error.name === 'NotAllowedError' || error.name === 'SecurityError'
}

/** Read-only optimization, not a substitute for getUserMedia or a permission request. */
export async function microphonePermissionIsDenied(): Promise<boolean> {
  try {
    if (!navigator.permissions?.query) return false
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return permission.state === 'denied'
  } catch { return false } // Some browsers cannot query the microphone permission.
}

export function microphoneHelpDevice(userAgent: string, platform: string, touchPoints: number): MicrophoneHelpDevice {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1)) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return 'computer'
}
