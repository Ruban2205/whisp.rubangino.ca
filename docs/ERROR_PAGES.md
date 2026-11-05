# Motion error pages and Vercel setup

Updated November 5, 2026. Error screens share Whisp's dark space, warm gold light, orbiting stars, and gentle arrival transitions. CSS motion respects reduced motion and small/short screens. Standalone host error files work without JavaScript and fall back to system fonts if assets fail.

## Included screens

| Situation | Implementation |
| --- | --- |
| Missing URL | `dist/404.html`, served with HTTP 404 by the static host. |
| Restricted, slow, busy, or unavailable request | Standalone `403.html`, `408.html`, `429.html`, `500.html`, `503.html`, `504.html`. Host support determines whether these replace platform responses. |
| Connection lost after startup | Offline overlay keeps the notebook mounted. Keep writing offline resumes local typing. Voice model downloads may need a connection. |
| React render failure | Boundary offers the last available committed writing in memory, copy/view controls, and Restore my page. |
| Unexpected browser error or rejected promise | Recovery overlay returns to the same page. Microphone/voice stop and sound pauses. |
| Main script or stylesheet fails | Independent bootstrap shows a pre-rendered startup recovery panel without automatically reloading. |
| Speech, microphone device, sound, or release animation fails | Themed dialog with retry or return to writing. Permission denials retain the device-specific settings-help dialog. |

An animation failure returns the words rather than marking them released. Successful fallbacks, such as a browser without canvas, can still complete quietly. Expected validation and cache-clear notices stay beside their controls.

Recovery adds no storage, telemetry, writing upload, or automatic reload. A render failure can recover only the last committed snapshot, not a guarantee of every keystroke. Released writing is not retained by the boundary; the existing 20-second undo is separate. Refreshing/closing, a browser terminating the tab, or a failure of recovery itself can lose writing.

## Preview locally

```sh
npm run dev
```

Open **http://127.0.0.1:5173/errors/** for all designs. The gallery and `/errors/voice/`, `/errors/offline/`, and other feature previews exist only in development. They do not trigger a real outage.

`npm run build` excludes the gallery, feature-preview routes, `offline.html`, and `startup.html`; the client bundle also removes development gallery code. Production requests to these paths return the normal HTTP 404. The release gate checks that preview files, docs, tests, branding files, source maps, and gallery text are absent from the output. No environment flag is needed to make the production build safe.

To check the real release, run `npm run build` then `npm run preview` and open **http://127.0.0.1:4173/**. A missing URL, including `/errors/`, must return HTTP 404. About and How it works remain intentional public product/SEO pages. The numbered status documents, including `404.html` and `500.html`, remain at the output root for hosting error handling; direct visits to those files can still display them. All host error documents are noindex and omitted from the sitemap.

## Vercel: standard custom 404

1. Import/update the project in Vercel. Choose Vite, repository root, Node 24, install `npm ci`, build `npm run build`, output `dist`. The supplied `vercel.json` sets build/output commands and headers.
2. Deploy and attach **whisp.rubangino.ca**, using Vercel's supplied DNS records. No database, function, secret, or error-page environment variable is needed.
3. Keep `dist/404.html` at the output root. Vercel documents this mechanism for static-generated sites: [Custom 404 page](https://vercel.com/kb/guide/custom-404-page).
4. Do **not** add a blanket rewrite such as `/(.*) → /index.html`; it defeats genuine 404 behavior. The information pages are real generated directories.
5. Verify a missing deployed URL shows Whisp's design with status **404**. Public pages must return 200 and remain indexable.

```sh
curl -I https://whisp.rubangino.ca/a-page-that-does-not-exist
curl -I https://whisp.rubangino.ca/about/
curl -I https://whisp.rubangino.ca/500.html
```

The last command checks a static preview, normally status 200. It does not prove a platform 500 has been replaced.

## Vercel: platform error replacement

Vercel's **platform custom error pages are Enterprise-only**: [Custom Error Pages documentation](https://vercel.com/docs/custom-error-pages). The platform scans static output for files such as `500.html` and `504.html`, uses a matching status page, and can use `500.html` as a fallback. This build emits those files with inline motion styles and no JavaScript dependency; no rewrite or server-rendered handler is required.

For an Enterprise project, retain the root status files and verify feature availability with Vercel/support on a preview before relying on it during an incident. On other plans, standard 404 and client-side recovery work, but merely adding `500.html` does **not** replace Vercel's infrastructure errors.

App code cannot replace browser-owned DNS/TLS errors, offline startup before HTML arrives, deployment protection screens, or a host that never delivers the page. There is no service worker or promise of offline startup.

## Verification and maintenance

- `npm run build` generates public/host-error HTML and checks identity, canonical/noindex rules, sitemap, bootstrap order, assets, configuration, and exclusion of development content.
- `tests/e2e/error-recovery.spec.ts` forces async, React, canvas, audio, and offline failures. It checks writing recovery, accessibility, reduced motion, and responsive layouts. Other suites cover device/voice failures and settings recovery.
- With production preview running, `node scripts/verify-errors.mjs` checks genuine HTTP 404, absent preview/developer routes, JavaScript-disabled public pages, motion under production CSP, and startup recovery after blocked compiled script/stylesheet. Set `WHISP_BROWSER=firefox` or `webkit` for those engines.
- Check actual deployed statuses, headers, and platform behavior after deployment. Local tests do not validate Vercel entitlements or deploy anything.

Copy: `src/lib/errors.ts`. Layout: `src/components/ErrorSpace.tsx`. Motion: `public/error-space.css`. Generation: `scripts/prerender.mjs`. Do not edit `dist/` by hand.
