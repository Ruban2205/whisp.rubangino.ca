# Deploying whisp.rubangino.ca

The baseline source was published to GitHub. A local commit of the voice, quotes, sound-effects, homepage, and portal updates is approved. Their GitHub push still requires separate approval. Production deployment is still pending separate approval. These deployment instructions are not actions already performed.

## Prepare the static release

1. Complete the manual checklist in `TESTING.md`, especially real breath testing.
2. Run `npm ci`, `npm test`, `npm run test:e2e`, and `npm run build`.
3. Run `npm run preview`. Check the production build at the printed Local URL, including the favicon, privacy dialog, sharing image, and reduced-motion flow.
4. After approval, deploy the contents of `dist/` to a static host. No server function, database, environment variables, or application secret is needed.

For a host with a build pipeline:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Node.js | 24 LTS (or supported Node 22.12+) |
| Root directory | Repository root |
| Production domain | `whisp.rubangino.ca` |

## Domain and TLS

Add `whisp.rubangino.ca` as a custom domain in the chosen host. In the DNS zone for `rubangino.ca`, add the CNAME or A/AAAA records the host supplies for the `whisp` subdomain. The correct target depends on the chosen host; do not guess it. Wait for domain validation and provision a valid HTTPS certificate. Redirect HTTP to HTTPS.

The canonical URL, Open Graph URL/image, robots.txt, and sitemap.xml already use `https://whisp.rubangino.ca/`. Update all four if the domain changes. Do not expose a staging hostname to indexing without first adding the appropriate noindex header.

## Security headers

Hosts supporting the `_headers` format can use the included file. Verify response headers after publishing; some hosts silently ignore this file. For other hosts, configure equivalents:

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'
Permissions-Policy: microphone=(self), camera=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

Inline styles are needed for the live breath/swipe progress indicators. Inline scripts are not needed. Add HSTS only after verifying the HTTPS deployment and understanding its scope. Do not enable parent-domain preload or includeSubDomains casually.

## Caching and verification

- Cache hashed `/assets/` files for a long period with `immutable`.
- Serve `index.html` with revalidation so releases pick up new asset hashes.
- Ensure `.woff2`, `.svg`, `.png`, and `.xml` receive appropriate content types.
- No SPA rewrite is required; the app uses only `/` and no client routes.
- Test the production HTTPS microphone permission flow, explicit stop, tab backgrounding, and device disconnect.
- Confirm no writing or audio requests appear in the Network panel. Hosting access logs are separate; the host may collect IP addresses and request metadata, so review its configuration and retention.
- Confirm `/og-image.png`, `/favicon.svg`, `/robots.txt`, and `/sitemap.xml` return 200.
- Keep the prior deploy available for rollback. Version the source only after user approval to push.

## Self-hosted voice assets

The build now runs `scripts/prepare-voice.mjs` first. Give the build environment network access to download the pinned public model from Hugging Face; it needs no token. Generated `public/voice-model/` and `public/voice-runtime/` directories are ignored by Git and reconstructed before dev/build. Do not omit them from `dist/` or from a static upload.

The q8 decoder is approximately 31 MB; ensure the host allows individual static assets of that size. Voice typing transfers roughly 70 MB on first use, separate from the small default application. These are public model/runtime assets, never recordings. All runtime requests remain on the site's origin.

Serve `.wasm` as `application/wasm`, worker `.js`/`.mjs` as JavaScript, and model `.onnx` as binary. The CSP needs `script-src 'self' 'wasm-unsafe-eval'` and `worker-src 'self'`; ordinary JavaScript `unsafe-eval` is not needed. `connect-src 'self'` is retained. WASM inference uses a single worker thread and does not require COOP/COEP headers. The compiled speech worker is verified with the production CSP in a local browser test; actual host headers still require post-deployment verification.

Cache public model files sensibly, revalidate config files when model revisions change, and preserve the named asset paths. Help clears the app's named model cache; browser/host HTTP caches are managed separately. No writing/audio should ever appear in HTTP request bodies, cache keys, URLs, or logs.
