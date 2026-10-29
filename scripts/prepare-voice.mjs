import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const revision = '79fb389fc764e7c395bd330e9531d9d32ada7049'
const model = 'Xenova/whisper-tiny.en'
const files = ['config.json', 'generation_config.json', 'preprocessor_config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'added_tokens.json', 'normalizer.json', 'vocab.json', 'merges.txt', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx']
const destination = path.join(root, 'public/voice-model', model)
await fs.mkdir(destination, { recursive: true })
const manifest = { model, revision, files: {} }
await Promise.all(files.map(async file => {
  const output = path.join(destination, file)
  await fs.mkdir(path.dirname(output), { recursive: true })
  try { await fs.access(output) } catch {
    console.log(`Preparing local voice asset: ${file}`)
    const response = await fetch(`https://huggingface.co/${model}/resolve/${revision}/${file}`)
    if (!response.ok) throw new Error(`Voice asset download failed (${response.status}): ${file}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!bytes.length) throw new Error(`Empty voice asset: ${file}`)
    await fs.writeFile(`${output}.partial`, bytes)
    await fs.rename(`${output}.partial`, output)
  }
  const bytes = await fs.readFile(output)
  manifest.files[file] = { bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
}))
const runtime = path.join(root, 'public/voice-runtime')
await fs.rm(runtime, { recursive: true, force: true })
await fs.mkdir(runtime, { recursive: true })
for (const filename of (await fs.readdir(path.join(root, 'node_modules/onnxruntime-web/dist'))).filter(name => /^ort-wasm-simd-threaded.*\.(mjs|wasm)$/.test(name))) {
  await fs.copyFile(path.join(root, 'node_modules/onnxruntime-web/dist', filename), path.join(runtime, filename))
}
await fs.writeFile(path.join(root, 'public/voice-model/manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log('Private voice assets ready. Runtime and model will be served from this site; no user audio is sent elsewhere.')
