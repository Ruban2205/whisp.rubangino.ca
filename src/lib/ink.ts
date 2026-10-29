export interface InkPoint { x: number; y: number; alpha: number }
export interface InkSnapshot { texture: HTMLCanvasElement; points: InkPoint[]; x: number; y: number; width: number; height: number; dpr: number }
export interface MeasuredLine { text: string; x: number; y: number; rtl: boolean }

/** Use the browser's own shaping/wrapping engine, never approximate Unicode with JS character widths. */
export function measureEditorLines(editor: HTMLTextAreaElement): MeasuredLine[] {
  const style = getComputedStyle(editor)
  const mirror = document.createElement('div')
  const copied = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'tabSize', 'textAlign', 'direction'] as const
  for (const key of copied) mirror.style[key] = style[key]
  Object.assign(mirror.style, { position: 'fixed', left: '0', top: '0', visibility: 'hidden', pointerEvents: 'none', width: `${editor.clientWidth}px`, whiteSpace: 'pre-wrap', overflowWrap: 'break-word', padding: '0', border: '0', margin: '0' })
  mirror.textContent = editor.value
  mirror.setAttribute('aria-hidden', 'true')
  document.body.appendChild(mirror)
  try {
    const node = mirror.firstChild
    if (!node) return []
    const range = document.createRange()
    const lineHeight = parseFloat(style.lineHeight)
    const lines: MeasuredLine[] = []
    let line: MeasuredLine | undefined
    // Graphemes keep combining marks and surrogate pairs together; canvas renders whole lines for Arabic shaping.
    const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(editor.value)
    for (const { segment, index } of segments) {
      range.setStart(node, index); range.setEnd(node, index + segment.length)
      const rect = range.getBoundingClientRect()
      const lineY = Math.floor((rect.top + rect.height / 2) / lineHeight) * lineHeight - editor.scrollTop
      if (!line || Math.abs(line.y - lineY) > 1 || segment === '\n') {
        line = { text: '', x: rect.left, y: lineY, rtl: false }
        lines.push(line)
      }
      if (segment !== '\n') { line.text += segment; line.x = Math.min(line.x, rect.left) }
      if (segment === '\n') line = undefined
    }
    range.detach()
    for (const item of lines) item.rtl = /^[\s\p{P}\p{N}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(item.text)
    return lines.filter(item => item.text && item.y + lineHeight > 0 && item.y < editor.clientHeight)
  } finally { mirror.remove() }
}

export function sampleInkPixels(data: Uint8ClampedArray, width: number, height: number, budget: number, dpr = 1): InkPoint[] {
  const points: InkPoint[] = []
  // Count ink first so sampling is uniform across the entire visible entry, not truncated at the top.
  let ink = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 45) ink++
  const stride = Math.max(1, Math.ceil(ink / budget))
  let seen = 0
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const alpha = data[(y * width + x) * 4 + 3]
    if (alpha > 45 && seen++ % stride === 0) points.push({ x: x / dpr, y: y / dpr, alpha: alpha / 255 })
  }
  return points
}

export async function snapshotInk(editor: HTMLTextAreaElement, budget: number): Promise<InkSnapshot | null> {
  await document.fonts.ready
  const style = getComputedStyle(editor)
  const rect = editor.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const texture = document.createElement('canvas')
  texture.width = Math.ceil(editor.clientWidth * dpr); texture.height = Math.ceil(editor.clientHeight * dpr)
  const context = texture.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.scale(dpr, dpr)
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  context.fillStyle = style.color; context.textBaseline = 'alphabetic'
  // Estimate baseline from actual ascent/descent, centered in the exact CSS line box.
  const metrics = context.measureText('Hg')
  const ascent = metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * 0.85
  const descent = metrics.fontBoundingBoxDescent || parseFloat(style.fontSize) * 0.25
  const baseline = (parseFloat(style.lineHeight) - ascent - descent) / 2 + ascent
  for (const line of measureEditorLines(editor)) {
    context.direction = line.rtl ? 'rtl' : 'ltr'
    context.textAlign = 'left'
    context.fillText(line.text.replace(/\t/g, '    '), line.x, line.y + baseline)
  }
  const pixels = context.getImageData(0, 0, texture.width, texture.height)
  return { texture, points: sampleInkPixels(pixels.data, texture.width, texture.height, budget, dpr), x: rect.left, y: rect.top, width: editor.clientWidth, height: editor.clientHeight, dpr }
}
