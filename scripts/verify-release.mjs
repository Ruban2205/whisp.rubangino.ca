import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = 'dist', origin = 'https://whisp.rubangino.ca'
const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'Landing content must exist once in the delivered HTML')
assert.match(html, /A private notebook to write, breathe, and let go\./)
assert.match(html, /Enter your space/)
assert.match(html, /<link rel="canonical" href="https:\/\/whisp\.rubangino\.ca\/"/)
assert.match(html, /https:\/\/labs\.rubangino\.ca\//)
assert.doesNotMatch(html, /<textarea|ink-transferred/, 'Only the empty public landing state may be pre-rendered')
assert.doesNotMatch(html, /src="\/src\//, 'Production must reference compiled assets')
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
const app = schema['@graph'].find(node => node['@type'] === 'WebApplication')
assert.equal(app.url, `${origin}/`); assert.equal(app.isAccessibleForFree, true)
assert.equal(schema['@graph'].find(node => node['@type'] === 'Organization').url, 'https://labs.rubangino.ca/')
assert.doesNotMatch(JSON.stringify(schema), /aggregateRating|reviewCount/, 'Do not invent ratings or reviews')
const manifest = JSON.parse(await fs.readFile(path.join(root, 'site.webmanifest'), 'utf8'))
assert.equal(manifest.start_url, '/'); assert.equal(manifest.display, 'browser')
for (const [file, size] of [['favicon-48.png', 48], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const bytes = await fs.readFile(path.join(root, file))
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG')
  assert.equal(bytes.readUInt32BE(16), size); assert.equal(bytes.readUInt32BE(20), size)
}
const ico = await fs.readFile(path.join(root, 'favicon.ico'))
assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3)
const og = await fs.readFile(path.join(root, 'og-image.png'))
assert.equal(og.readUInt32BE(16), 1200); assert.equal(og.readUInt32BE(20), 630)
for (const asset of ['favicon.svg', 'voice-capture.worklet.js', ...manifest.icons.map(icon => icon.src.slice(1))]) await fs.access(path.join(root, asset))
const robots = await fs.readFile(path.join(root, 'robots.txt'), 'utf8')
assert.match(robots, /Allow: \/\n/); assert.match(robots, /Sitemap: https:\/\/whisp\.rubangino\.ca\/sitemap\.xml/)
assert.match(await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/whisp\.rubangino\.ca\/<\/loc>/)
const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'))
const headers = await fs.readFile('public/_headers', 'utf8')
const policy = headers.split('\n').find(line => line.includes('Content-Security-Policy:')).split('Content-Security-Policy:')[1].trim()
assert.equal(config.headers[0].headers.find(header => header.key === 'Content-Security-Policy').value, policy)
for (const prefix of ['model', 'runtime']) {
  assert.equal(config.headers.find(rule => rule.source === `/voice-${prefix}/:path*`).headers.find(header => header.key === 'Cache-Control').value, 'no-store')
  await fs.access(path.join(root, `voice-${prefix}`))
}
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)) await fs.access(path.join(root, match[1].slice(1)))
console.log('Release verified: crawlable landing HTML, canonical/schema/attribution, search/share icons, sitemap/robots, speech assets, and security/cache policy.')
