/* Collect short PCM blocks on the audio thread, with no recorder, network, or persistent storage. */
class WhispVoiceCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.block = new Float32Array(2048)
    this.offset = 0
    this.running = true
    this.port.onmessage = event => {
      if (event.data === 'stop') {
        this.port.postMessage({ audio: this.block.slice(0, this.offset), sampleRate, final: true })
        this.block.fill(0); this.offset = 0; this.running = false
      }
    }
  }
  process(inputs) {
    if (!this.running) return false
    const input = inputs[0]?.[0]
    if (!input) return true
    for (let i = 0; i < input.length; i++) {
      this.block[this.offset++] = input[i]
      if (this.offset === this.block.length) {
        this.port.postMessage({ audio: this.block, sampleRate }, [this.block.buffer])
        this.block = new Float32Array(2048); this.offset = 0
      }
    }
    // Outputs remain silent: input is never played back.
    return true
  }
}
registerProcessor('whisp-voice-capture', WhispVoiceCapture)
