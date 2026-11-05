<p align="center"><img src="public/favicon.svg" width="72" height="72" alt="Whisp logo" /></p>

# Whisp

**A little space to let go.**

Whisp is a free, private online notebook for the thoughts you are ready to set down. Write or speak at your own pace, take a comfortable breath, and watch your words drift away. An original supportive note appears when the page clears.

Created by **[Ruban Gino Singh](https://www.rubangino.ca/)** and published by **[Ruban AI Labs](https://labs.rubangino.ca/)**. Production domain: **[whisp.rubangino.ca](https://whisp.rubangino.ca/)**.

![Whisp's private notebook](docs/preview-notebook.png)

## The experience

- **Write without signing up.** A native, editable notebook supports multiline text, selection, paste, Unicode, and keyboard undo.
- **Speak privately.** Optional English voice typing runs a self-hosted Whisper Tiny model on the visitor’s device. Recognized phrases append to the page; non-speech annotations are filtered.
- **Release at your own pace.** In Normal mode, take a deep breath in, then blow toward your screen. Choose Gentle breath for a softer response, confirm **Let it go**, or use an intentional swipe.
- **Find a little encouragement.** One of 100 original supportive notes appears after release, with local theme matching and randomized rotation.
- **Enjoy a quiet atmosphere.** Cosmic journeys, paper-to-light transitions, original ambient music, and gentle wind effects share one sound control.
- **Use the screen comfortably.** Layouts adapt to phones, tablets, desktop, landscape, and short viewports. Reduced motion, keyboard navigation, accessible controls, and a 20-second restore option are included.
- **Recover within the same space.** Animated error screens handle connection loss, loading problems, and supported input failures. Recoverable interruptions preserve writing in tab memory where available.

Microphone use is disclosed before entry and can be turned off. Sound starts after interaction and can be muted. Voice typing has a separate first-use explanation and enable action. A blocked microphone request opens a clear settings-help dialog with a retry and a way to keep writing without microphone access; the app does not reload or discard the draft.

## Privacy

Whisp has no accounts, analytics, application backend, saved drafts, or cloud transcription.

| Data | Handling |
| --- | --- |
| Writing | Temporary tab memory; never written to local/session storage, cookies, or a database. Refreshing or closing loses it. |
| Released writing | Available through **Bring it back** for 20 seconds. Expiry, beginning again, or returning home drops the restore copy. |
| Microphone audio | Breath is analyzed locally. Voice uses short in-memory audio segments, then clears/discards them and terminates its worker. Nothing is uploaded. |
| Speech-model files | Public assets served from this site. The app-owned model cache clears automatically after successful release or return home; Help offers manual clearing. |
| Supportive-note selection | Local keywords and quote IDs; no user profile or remote analysis. |

Optional voice typing initially transfers about **70 MB** of public model/runtime assets. Clearing the cache can require another download. Ordinary browser caches, memory reclamation, browser extensions, operating-system behavior, and host access logs are outside the app’s control; secure memory erasure cannot be guaranteed.

Speech recognition and breath detection can make mistakes. Every transcript is editable, and typing/manual release remain available. Whisp is a reflective experience, not medical care or a promise of relief.

## Local development

Use **Node.js 24 LTS** (`.nvmrc`), or another version supported by `package.json`.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. No `.env` file, API key, database, or application secret is required. Microphone features need localhost or HTTPS.

Before development and production builds, the preparation script downloads pinned public speech assets from Hugging Face and copies the installed WASM runtime. The first preparation requires internet access; subsequent runs reuse verified local files. Generated speech directories are excluded from Git and included in the production output.

## Validation

```sh
npm test                  # Unit tests
npm run typecheck         # Strict TypeScript
npx playwright install chromium firefox webkit
npm run test:e2e           # Desktop and phone-emulation browser matrix
npm run build             # Prepare assets, typecheck, compile, pre-render, verify release
npm run verify:release    # Recheck the existing dist/ artifact
npm run preview           # Serve dist/ at http://127.0.0.1:4173/
```

With the production preview running:

```sh
node scripts/verify-production.mjs
node scripts/verify-errors.mjs
node scripts/verify-voice.mjs
```

Set `WHISP_BROWSER=firefox` or `WHISP_BROWSER=webkit` to run the production smoke check in those engines.

The checks cover production hydration/security policy, a readable homepage without JavaScript, release/restore, metadata, asset responses, storage, silence rejection, and real local recognition of a public speech fixture. For installed Brave, set `WHISP_BRAVE_EXECUTABLE` to its executable path when running Playwright. Browser tests use isolated profiles.

GitHub Actions runs unit tests and the complete production build on pushes to `main` and pull requests. It does not deploy. Physical microphone, actual phone, virtual-keyboard, and assistive-technology checks remain part of manual release validation. See [Testing](docs/TESTING.md).

## Production deployment

The application builds into **`dist/`**, including speech assets, a pre-rendered homepage, static About/How it works pages, and standalone motion error screens. The interactive notebook remains in the browser; pre-rendering never includes user writing or recordings.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `dist` |
| Node.js | 24 LTS |
| Canonical domain | `https://whisp.rubangino.ca/` |

`vercel.json` includes build settings, security headers, immutable hashed-asset caching, and no-store headers for speech downloads. `_headers` supplies equivalents for compatible static hosts. No inference server, API key, or cross-origin model fallback is needed.

Vercel can serve the generated `404.html` for missing pages without an SPA rewrite. Replacing Vercel's own platform error screens requires Enterprise. See [Motion errors and Vercel setup](docs/ERROR_PAGES.md). The design gallery is development-only: run `npm run dev` and open **http://127.0.0.1:5173/errors/**. Production builds exclude the gallery and feature-preview routes; they return 404 in production preview and on the static host.

Choose a hosting plan appropriate to this project’s use and bandwidth. Vercel Hobby eligibility is restricted to personal, non-commercial use; free access for visitors alone does not establish eligibility. See the [deployment guide](docs/DEPLOYMENT.md) for plan details, HTTPS/DNS, and launch checks. Deployment is performed by the owner.

## Search and sharing

The homepage, `/about/`, and `/how-it-works/` deliver crawlable public HTML with unique production canonicals, Open Graph/Twitter cards, and linked Person/Organization/WebSite/WebApplication structured data. Visible creator credits connect Whisp to Ruban Gino Singh, his official portfolio, and Ruban AI Labs. The sitemap lists public pages; host error documents are noindex and development previews are excluded from production. No invented reviews, ratings, or ranking claims are included.

After launch, verify the domain in Google Search Console and submit `https://whisp.rubangino.ca/sitemap.xml`. See [SEO and launch verification](docs/SEO.md).

## Project documentation

- [License and reuse guidance](docs/LICENSING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing and device checklist](docs/TESTING.md)
- [Microphone access and recovery](docs/MICROPHONE_ACCESS.md)
- [Motion errors and Vercel setup](docs/ERROR_PAGES.md)
- [Deployment](docs/DEPLOYMENT.md)
- [SEO and launch verification](docs/SEO.md)
- [Feature updates](docs/FEATURE_UPDATES.md)
- [Third-party licenses and attribution](THIRD_PARTY_NOTICES.md)

**Developer:** [Ruban Gino Singh](https://www.rubangino.ca/) · **Publisher:** [Ruban AI Labs](https://labs.rubangino.ca/) · **Source:** [Ruban2205/whisp.rubangino.ca](https://github.com/Ruban2205/whisp.rubangino.ca)

## License and attribution

Copyright 2026 **Ruban Gino Singh, operating as Ruban AI Labs** (a registered sole proprietorship).

Project-authored materials are available under the **[Apache License 2.0](LICENSE)** to the extent of the rights held by the licensor and contributors. Free and commercial reuse are permitted under its terms. Redistributors must preserve applicable license/copyright notices, retain the publisher/developer attribution in [NOTICE](NOTICE) as required by the license, and identify modified files. A permanent website footer credit is not an additional requirement.

No patent, registered intellectual-property right, or exclusive ownership of the idea is claimed. Apache 2.0 does not require owning a patent; its patent grant covers only relevant rights a contributor can license. Inspiration from other resources does not give permission to copy their protected code, text, or artwork.

Third-party libraries, fonts, speech models, and fixtures retain their own licenses. The license does not grant general trademark rights or imply endorsement. See [licensing and attribution guidance](docs/LICENSING.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
