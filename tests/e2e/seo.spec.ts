import { test, expect } from '@playwright/test'

test('public metadata, developer attribution, icons and manifest use production identity', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Whisp — Private Online Notebook | Ruban Gino Singh')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://whisp.rubangino.ca/')
  await expect(page.getByRole('link', { name: /Ruban AI Labs/ })).toHaveAttribute('href', 'https://labs.rubangino.ca/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}')
  expect(schema['@graph'].find((item: { '@type': string }) => item['@type'] === 'WebApplication').url).toBe('https://whisp.rubangino.ca/')
  const person = schema['@graph'].find((item: { '@type': string }) => item['@type'] === 'Person')
  expect(person.name).toBe('Ruban Gino Singh')
  expect(person.url).toBe('https://www.rubangino.ca/')
  expect(schema['@graph'].find((item: { '@type': string }) => item['@type'] === 'WebApplication').creator['@id']).toBe(person['@id'])
  for (const path of ['/favicon.svg', '/favicon.ico', '/favicon-48.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png']) expect((await page.request.get(path)).ok()).toBe(true)
  const manifest = await (await page.request.get('/site.webmanifest')).json()
  expect(manifest.name).toContain('Whisp')
  expect(manifest.icons).toHaveLength(2)
})
