export const SPEECH_CACHE_NAME = 'whisp-voice-model-v1'
export type CacheClearStatus = 'cleared' | 'unavailable' | 'failed'
export async function clearSpeechModelCache(): Promise<CacheClearStatus> {
  if (!('caches' in globalThis)) return 'unavailable'
  try { await caches.delete(SPEECH_CACHE_NAME); return 'cleared' } catch { return 'failed' }
}
