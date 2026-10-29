# Deploying whisp.rubangino.ca

The owner approved committing and pushing the complete release after successful local testing. The owner will deploy it. No production deployment or DNS changes have been performed by this agent.

## Prepare the static release

1. Complete the manual checklist in `TESTING.md`, especially real breath testing.
2. Run `npm ci`, `npm test`, `npm run test:e2e`, and `npm run build`.
3. Run `npm run preview`. Check the production build at the printed Local URL, including the favicon, privacy dialog, sharing image, and reduced-motion flow.
4. Deploy the contents of `dist/` to a static host. No server function, database, environment variables, or application secret is needed.

For a host with a build pipeline:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (install separately with `npm ci`) |
| Output directory | `dist` |
| Node.js | 24 LTS (or supported Node 22.12+) |
| Root directory | Repository root |
| Production domain | `whisp.rubangino.ca` |

## Domain and TLS

Add `whisp.rubangino.ca` as a custom domain in the chosen host. In the DNS zone for `rubangino.ca`, add the CNAME or A/AAAA records the host supplies for the `whisp` subdomain. The correct target depends on the chosen host; do not guess it. Wait for domain validation and provision a valid HTTPS certificate. Redirect HTTP to HTTPS.

The canonical URL, Open Graph URL/image, structured data, robots.txt, and sitemap.xml already use `https://whisp.rubangino.ca/`. Update all four if the domain changes. Do not expose a staging hostname to indexing without first adding the appropriate noindex header.

## Security headers

Hosts supporting the `_headers` format can use the included file. Verify response headers after publishing; some hosts silently ignore this file. For other hosts, configure equivalents:

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'
Permissions-Policy: microphone=(self), camera=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Inline styles are needed for the live breath/swipe progress indicators. The JSON-LD script is non-executable metadata; executable inline scripts are not needed. Add HSTS only after verifying the HTTPS deployment and understanding its scope. Do not enable parent-domain preload or includeSubDomains casually.

## Caching and verification

- Cache hashed `/assets/` files for a long period with `immutable`.
- Serve `index.html` with revalidation so releases pick up new asset hashes.
- Ensure `.woff2`, `.svg`, `.png`, and `.xml` receive appropriate content types.
- No SPA rewrite is required; the app uses only `/` and no client routes.
- Test the production HTTPS microphone permission flow, explicit stop, tab backgrounding, and device disconnect.
- Confirm no writing or audio requests appear in the Network panel. Hosting access logs are separate; the host may collect IP addresses and request metadata, so review its configuration and retention.
- Confirm `/og-image.png`, `/favicon.svg`, `/robots.txt`, and `/sitemap.xml` return 200.
- Keep the prior deploy available for rollback. Use the tested Git commit for reproducible deployment.

## Self-hosted voice assets

The build now runs `scripts/prepare-voice.mjs` first. Give the build environment network access to download the pinned public model from Hugging Face; it needs no token. Generated `public/voice-model/` and `public/voice-runtime/` directories are ignored by Git and reconstructed before dev/build. Do not omit them from `dist/` or from a static upload.

The q8 decoder is approximately 31 MB; ensure the host allows individual static assets of that size. Voice typing transfers roughly 70 MB on first use, separate from the small default application. These are public model/runtime assets, never recordings. All runtime requests remain on the site's origin.

Serve `.wasm` as `application/wasm`, worker `.js`/`.mjs` as JavaScript, and model `.onnx` as binary. The CSP needs `script-src 'self' 'wasm-unsafe-eval'` and `worker-src 'self'`; ordinary JavaScript `unsafe-eval` is not needed. `connect-src 'self'` is retained. WASM inference uses a single worker thread and does not require COOP/COEP headers. The compiled speech worker is verified with the production CSP in a local browser test; actual host headers still require post-deployment verification.

Preserve named asset paths and serve `/voice-model/*` and `/voice-runtime/*` with `Cache-Control: no-store`. The worker also requests these files with `cache: no-store`. The temporary app-owned Cache API namespace holds only public model files and is deleted automatically after successful release or return home. Help provides a retry/manual clear. Ordinary app-code caches are separate. No writing/audio should ever appear in HTTP request bodies, cache keys, URLs, or logs.


## Vercel and the free plan

Research checked October 29, 2026. The current architecture is a static Vite site: speech runs on the visitor’s device, so Vercel does not run a speech model or need a paid inference function. The supplied `vercel.json` sets `npm ci`, `npm run build`, `dist`, the CSP/security headers, and no-store headers for speech downloads. These settings prepare deployment; no Vercel project has been created or deployed.

Free hosting is conditional. Vercel [Hobby](https://vercel.com/docs/plans/hobby) is for personal, non-commercial use. Its [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) treat financial gain, paid development, advertising products/services, payments, and advertising as commercial indicators. Being free to visitors does not by itself establish that a Ruban AI Labs project qualifies. Choose a suitable paid plan or confirm eligibility with Vercel if this is a business project.

Hobby currently includes [100 GB of Fast Data Transfer](https://vercel.com/docs/manage-cdn-usage). Voice assets transfer roughly 70 MB on first use, with re-downloads after automatic cache clearing. That bandwidth comes from the site’s allowance even though inference is local. This is therefore not unlimited free speech hosting; traffic and repeated voice sessions matter.

The [documented Hobby CLI source-upload limit is 100 MB](https://vercel.com/docs/limits). `.vercelignore` excludes dependencies, generated speech assets, test clips, reports, and preview captures from source uploads. The build reconstructs the pinned public assets and includes them in `dist`; it needs outbound access to Hugging Face during that build, with no token. The source-upload limit should not be confused with an individual static-file or total build-output limit.

Vercel supports these [project configuration settings and headers](https://vercel.com/docs/project-configuration). After an approved deployment, verify the live `.wasm` MIME type, CSP, `no-store` headers, microphone permissions over HTTPS, asset availability, and model transfer sizes. Local preview cannot validate Vercel’s live headers or account eligibility.


## Release artifact and launch handoff

The build prepares speech assets, compiles the app, pre-renders only its empty public landing state, and runs `verify-release.mjs`. The script verifies crawlable HTML, production identity, icons, sharing image dimensions, sitemap/robots, speech asset presence, and matching security/cache settings. No browser session or user text is involved in pre-rendering.

1. Import the GitHub repository into your chosen host. For Vercel, the included configuration supplies the build/output settings; select Node 24.
2. Ensure the build can download the pinned public model. No Hugging Face token is required. Do not run a production build with development dependencies omitted: the compiler and Vite are needed during build.
3. Deploy and attach `whisp.rubangino.ca`; use the exact DNS records supplied by the host and wait for valid HTTPS.
4. Confirm the production hostname returns 200 without a `noindex` header, then check CSP, `.wasm` MIME type, model assets, favicon, manifest, sharing image, writing, speech, breath release, and cache cleanup.
5. Complete [SEO launch verification](SEO.md), including Search Console domain verification and sitemap submission. No ownership-verification token has been fabricated or added.

GitHub Actions validates unit tests and build output only; no deployment credentials or automatic publishing steps are installed. If an existing hosting integration is connected to GitHub externally, its deployment behavior is managed in that service.
