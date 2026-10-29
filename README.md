# Whisp — A little space to let go

**Write it. Breathe it out. Let it go.** A free, private, browser-only experience by [Ruban AI Labs](https://rubangino.ca), intended for `https://whisp.rubangino.ca`.

Enter a quiet universe, travel into an ivory notebook, write freely, and watch the actual shapes of your words drift away as ink particles. Use a sustained breath, a confirmed button press, or an explicitly enabled swipe. There is no account, backend, analytics, or persistent draft storage.

**The owner approved publishing these microphone, music, entry, and Help updates to GitHub on October 29, 2026. Production deployment remains pending separate approval.**

## Run locally

Use Node.js 22.12+ (22.x) or 24+. The lockfile pins the tested dependencies. No `.env` file or API keys are needed.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally **http://127.0.0.1:5173/**. Microphones work on localhost or HTTPS. Plain HTTP over a phone's LAN IP generally cannot use the microphone; use a trusted HTTPS development endpoint for physical phone testing. Do not bypass certificate warnings.

```sh
npm test                 # Unit tests
npm run typecheck        # Strict TypeScript
npx playwright install chromium firefox webkit
npm run test:e2e         # Browser matrix, including phone emulation
npm run test:e2e:ui      # Interactive browser tests
npm run build           # Typecheck + production build into dist/
npm run preview         # Serve the production build, normally port 4173
```

Playwright starts the dev server automatically when one is not already running. HTML reports appear in `playwright-report/`; traces and failure captures appear in `test-results/`. Both are ignored by Git. `node scripts/capture-preview.mjs` captures design references and regenerates the Open Graph image while the dev server is running.

## The experience

- Original Canvas starfield, subtle parallax, orbital artwork, and a skippable 8.8-second portal journey with an original cosmic chime.
- Native multiline textarea, self-hosted handwriting font, ruled paper, international text, native undo/redo, selection, paste, and scrolling.
- Microphone selected by default, with a clear note and opt-out before entry. **Enter your space** requests browser permission; no microphone request occurs on page load. Analysis waits until the notebook opens, and release is armed only when writing is nonempty. The detector handles low-frequency turbulent wind as well as a soft hiss, rejects pitched/impulsive signals, and offers an input meter, Normal/Gentle breath sensitivity, and Recalibrate.
- Confirmed **Let it go** button and opt-in horizontal swipe. Every method uses the same ink renderer.
- A browser-measured text texture seeds up to 4,200 ink particles (1,800 on narrow screens). The wind progressively dissolves the visible writing over approximately 4.65 seconds. Long entries animate the current visible region; all text is retained until completion.
- **Bring it back** restores the full entry for 20 seconds. **Begin again**, returning home, or expiration drops the saved text reference.
- Reduced motion skips travel and replaces particle movement with a short fade. Canvas-unavailable browsers get a CSS fade. Sound is on by default and starts on the entry click, in keeping with browser autoplay policies. An original shimmering chime leads into a slow, soothing notebook score of sustained chords and sparse bell notes. Everything is synthesized locally. Playback is quieter while listening and softens promptly during a candidate breath to reduce speaker feedback; it stops on hidden tabs and can be resumed explicitly.
- Keyboard navigation, focus management, Help/privacy dialog explaining temporary tab memory (no local storage), live microphone status, responsive layout, and bundled SEO/social assets.

## Privacy and limits

Writing and audio stay within the browser tab. There are no runtime third-party requests for scripts, fonts, audio, or analysis. Nothing is recorded or uploaded. Browser extensions and the user's operating system remain outside the application's control.

Refreshing or closing loses an unreleased draft. A native browser warning is registered for nonempty drafts, but browsers (especially mobile browsers) may omit it. No draft recovery storage is used. JavaScript cannot promise forensic memory wiping after an undo reference is dropped.

Breath detection is a heuristic. Speech, fans, wind, distance, and microphone processing affect results; a sustained broadband sound can still resemble breath. The updated flow is tested in an installed Brave browser with simulated input, but is **not physically validated on actual microphones or phones**. Use the manual controls whenever listening is unreliable. Whisp offers a symbolic ritual, not treatment or guaranteed relief.

Pen drawing and device-orientation input are intentionally omitted; native writing remains the reliable primary input. Canvas 2D is used instead of WebGL for a smaller bundle and broad compatibility.

## Implementation and verification

- [Architecture and trade-offs](docs/ARCHITECTURE.md)
- [Browser and microphone test checklist](docs/TESTING.md)
- [Static deployment guide](docs/DEPLOYMENT.md)
- [Dependency/font notices](THIRD_PARTY_NOTICES.md)

`src/lib/state.ts` owns the deterministic ritual; `src/lib/breath.ts` contains the signal heuristics; `src/hooks/useBreathDetection.ts` owns microphone resources. `src/lib/soundscape.ts` composes the entry and notebook score; `src/lib/ink.ts` measures and rasterizes text; `src/components/InkRelease.tsx` choreographs the wind. Components and CSS own the paper and cosmic presentation.

For the optional installed-Brave project, set `WHISP_BRAVE_EXECUTABLE` to the Brave executable path and run `npm run test:e2e -- --project=brave`. Tests use a fresh isolated profile, not your personal browsing profile.

The tests cover state guards, successful/failed releases, Unicode and long entries, particle budgets/origins, calibration and sustained detection, simulated microphone permission/cancellation/disconnect/visibility cleanup, expiry, undo, responsive widths from 320px to 1920px, and automated accessibility checks. Browser emulation is not physical-device validation. See the checklist for the exact latest test results and remaining manual checks.

## Deployment

The `dist/` directory is a complete static site. Configure the host's custom domain as `whisp.rubangino.ca`, connect DNS using that host's provided target, and enable HTTPS. The included `public/_headers` defines security headers for compatible static hosts; other hosts need equivalent server configuration. Host access logs can record request metadata even though the app has no analytics; configure retention appropriately.

**Do not deploy to production without the owner’s separate approval.** No automatic publishing workflow is installed.
