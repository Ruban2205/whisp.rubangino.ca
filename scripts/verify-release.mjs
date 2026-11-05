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
const person = schema['@graph'].find(node => node['@type'] === 'Person')
assert.equal(person.name, 'Ruban Gino Singh'); assert.equal(person.url, 'https://www.rubangino.ca/')
assert.equal(app.creator['@id'], person['@id']); assert.equal(app.author['@id'], person['@id'])
assert.equal(app.publisher['@id'], schema['@graph'].find(node => node['@type'] === 'Organization')['@id'])
assert.doesNotMatch(JSON.stringify(schema), /aggregateRating|reviewCount/, 'Do not invent ratings or reviews')
assert.match(html, /id="startup-error"[^>]*hidden/)
assert.ok(html.indexOf('src="/recovery.js"') < html.indexOf('type="module"'), 'Recovery bootstrap must precede the application module')
for (const route of ['about', 'how-it-works']) {
  const page = await fs.readFile(path.join(root, route, 'index.html'), 'utf8')
  assert.equal((page.match(/<h1[\s>]/g) || []).length, 1)
  assert.ok(page.includes(`rel="canonical" href="${origin}/${route}/"`))
  assert.match(page, /name="robots" content="index, follow/)
  assert.match(page, /Ruban Gino Singh/); assert.match(page, /https:\/\/www\.rubangino\.ca\//)
  assert.doesNotMatch(page, /<textarea|type="module"|undefined\.woff/, 'Public information must be readable without JavaScript or writing')
  const graph = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
  assert.equal(graph.find(node => ['WebPage', 'AboutPage'].includes(node['@type'])).url, `${origin}/${route}/`)
}
const staticErrors = ['403', '404', '408', '429', '500', '503', '504']
for (const file of staticErrors.map(kind => `${kind}.html`)) {
  const page = await fs.readFile(path.join(root, file), 'utf8')
  assert.match(page, /name="robots" content="noindex, follow"/)
  assert.doesNotMatch(page, /<script|rel="canonical"/, 'Error pages must work without JavaScript and must not be canonical destinations')
  assert.match(page, /error-core-breathe/); assert.match(page, /prefers-reduced-motion/)
}
for (const file of ['errors', 'offline.html', 'startup.html', 'branding', 'docs', 'tests', 'src', 'README.md', 'playwright-report', 'test-results']) {
  await assert.rejects(fs.access(path.join(root, file)), { code: 'ENOENT' }, `Development-only content must not be published: ${file}`)
}
for (const asset of await fs.readdir(path.join(root, 'assets'))) {
  assert.ok(!asset.endsWith('.map'), 'Do not publish development source maps')
  if (asset.endsWith('.js')) assert.doesNotMatch(await fs.readFile(path.join(root, 'assets', asset), 'utf8'), /Whisp — Error screen previews|Even a pause can feel like space\.|Preview Whisp’s error and connection screens\./, 'The preview gallery must be removed from production JavaScript')
}
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
const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8')
for (const route of ['', 'about/', 'how-it-works/']) assert.ok(sitemap.includes(`<loc>${origin}/${route}</loc>`))
assert.doesNotMatch(sitemap, /errors|404|500/)
const config = JSON.parse(await fs.readFile('vercel.json', 'utf8'))
assert.equal(config.rewrites, undefined, 'A catch-all SPA rewrite would turn missing URLs into soft 404s')
for (const kind of staticErrors) assert.equal(config.headers.find(rule => rule.source === `/${kind}.html`).headers.find(header => header.key === 'X-Robots-Tag').value, 'noindex, follow')
const headers = await fs.readFile('public/_headers', 'utf8')
const policy = headers.split('\n').find(line => line.includes('Content-Security-Policy:')).split('Content-Security-Policy:')[1].trim()
assert.equal(config.headers[0].headers.find(header => header.key === 'Content-Security-Policy').value, policy)
for (const prefix of ['model', 'runtime']) {
  assert.equal(config.headers.find(rule => rule.source === `/voice-${prefix}/:path*`).headers.find(header => header.key === 'Cache-Control').value, 'no-store')
  await fs.access(path.join(root, `voice-${prefix}`))
}
for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)) await fs.access(path.join(root, match[1].slice(1)))
console.log('Release verified: three crawlable public pages, linked developer/company identity, standalone noindex motion error pages, startup recovery, search/share assets, speech assets, and security/cache policy.')
