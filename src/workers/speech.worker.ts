/// <reference lib="webworker" />
import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'
import { resamplePcm, cleanSpeechTranscript, hasAudibleSpeechCandidate } from '../lib/speech'

// Keep model/runtime downloads out of the HTTP cache; the explicit model cache is cleared on release.
const siteFetch = self.fetch.bind(self)
self.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), self.location.origin)
  const speechAsset = url.origin === self.location.origin && /^\/voice-(?:model|runtime)\//.test(url.pathname)
  return siteFetch(input, speechAsset ? { ...init, cache: 'no-store' } : init)
}
// No remote fallback: model and runtime are served from this site's origin.
env.allowLocalModels = true
env.allowRemoteModels = false
env.localModelPath = `${self.location.origin}/voice-model/`
env.useBrowserCache = false
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1
  env.backends.onnx.wasm.proxy = false
  env.backends.onnx.wasm.wasmPaths = `${self.location.origin}/voice-runtime/`
}
env.backends.onnx.logLevel = 'fatal'
let recognizer: AutomaticSpeechRecognitionPipeline | null = null
let loading: Promise<void> | null = null
async function load() {
  if (!loading) loading = (async () => {
    // This cache holds public model files only, never microphone samples or recognized words.
    if ('caches' in self) {
      try { env.customCache = await caches.open('whisp-voice-model-v1'); env.useCustomCache = true }
      catch { env.useCustomCache = false }
    }
    const createTranscriber = pipeline as unknown as (task: 'automatic-speech-recognition', model: string, options: { device: 'wasm'; dtype: 'q8'; local_files_only: boolean; progress_callback: (event: { progress?: number }) => void }) => Promise<AutomaticSpeechRecognitionPipeline>
    recognizer = await createTranscriber('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      device: 'wasm', dtype: 'q8', local_files_only: true,
      progress_callback: event => { if ('progress' in event) self.postMessage({ type: 'progress', progress: event.progress }) },
    })
  })().catch(error => { loading = null; throw error })
  await loading
}
self.onmessage = async (event: MessageEvent<{ type: 'load' | 'transcribe'; id?: number; audio?: Float32Array; sampleRate?: number }>) => {
  try {
    if (event.data.type === 'load') { await load(); self.postMessage({ type: 'ready' }); return }
    await load()
    if (!event.data.audio || !recognizer) throw new Error('No audio')
    const audio = resamplePcm(event.data.audio, event.data.sampleRate || 16000)
    if (!hasAudibleSpeechCandidate(audio)) {
      audio.fill(0); event.data.audio.fill(0)
      self.postMessage({ type: 'result', id: event.data.id, text: '' }); return
    }
    const result = await recognizer(audio, { max_new_tokens: 128, do_sample: false, return_timestamps: false })
    const text = (Array.isArray(result) ? result[0]?.text : result.text) || ''
    audio.fill(0); event.data.audio.fill(0)
    self.postMessage({ type: 'result', id: event.data.id, text: cleanSpeechTranscript(text) })
  } catch (error) { self.postMessage({ type: 'error', id: event.data.id, detail: error instanceof Error ? error.message : 'Local speech engine error' }) }
}
