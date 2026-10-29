# Whisp — A little space to let go

**Write it. Breathe it out. Let it go.** A free, private experience by [Ruban AI Labs](https://rubangino.ca), intended for `https://whisp.rubangino.ca`.

Step into a quiet universe, write or speak into a notebook, and let the actual shapes of your words drift away. An original supportive note appears after release. Whisp has no account, backend, analytics, cloud transcription, or saved drafts.

**The owner approved a local commit of the voice, quote, sound, homepage, and transition updates on October 29, 2026. GitHub push and production deployment require separate approval.**

## Run locally

Use Node.js 22.12+ (22.x) or 24+. No `.env` file or credentials are needed.

```sh
npm ci
npm run dev
```

Open the printed Local URL, normally **http://127.0.0.1:5173/**. Microphones require localhost or valid HTTPS; a plain HTTP phone LAN URL generally cannot use them.

Before dev/build, `scripts/prepare-voice.mjs` prepares pinned public speech-model assets and the installed WASM runtime. The first run requires internet access to download the model from Hugging Face. Subsequent runs reuse local files. Generated model/runtime files are ignored by Git; the production build includes them in `dist/`. Runtime users load these assets from your own host, with **no remote model or inference fallback**.

```sh
npm test                 # Unit tests
npm run typecheck        # Strict TypeScript
npx playwright install chromium firefox webkit
npm run test:e2e         # Browser matrix, including phone emulations
npm run test:e2e:ui      # Interactive browser tests
npm run prepare:voice    # Prepare self-hosted speech assets explicitly
npm run build           # Prepare assets + typecheck + build into dist/
npm run preview         # Serve the compiled site, normally port 4173
node scripts/verify-voice.mjs  # Real speech fixture + production CSP; preview must be running
node scripts/verify-production.mjs # Production release and privacy smoke
```

For installed Brave, set `WHISP_BRAVE_EXECUTABLE` to its executable path and run `npm run test:e2e -- --project=brave`. Automated tests use a fresh isolated profile, never your personal browsing profile. Reports are in `playwright-report/`; traces/failure captures are in `test-results/`. Both are ignored by Git.

## The experience

- A viewport-fitting invitation with refined copy, self-hosted fonts, original cosmic artwork, and quiet parallax. Extremely short/zoomed viewports can scroll to keep controls reachable.
- A skippable 8.8-second journey. The notebook is mounted beneath the final glow, which morphs into its measured paper rectangle and dissolves to reveal the texture. The page remains in place at arrival.
- A native multiline editor with handwriting, ruled paper, selection, paste, international text/IME, native undo/redo, and scrolling.
- Microphone selected by default, disclosed beside Enter with an opt-out. Permission is requested on entry; local breath calibration begins in the notebook. Sustained breath, input feedback, Normal/Gentle sensitivity, and Recalibrate remain available.
- **Speak your thoughts** offers optional private English voice typing. After the clear first-use note, the locally hosted Whisper Tiny model runs in a worker. Recognized phrases append to existing writing. Music and breath release pause while speaking. **Finish voice typing** flushes the last partial audio block, completes pending phrases, and re-enables breath when previously selected. Cancellation keeps words already written.
- The voice model/runtime initially transfers roughly 70 MB from this site. Only public model assets may remain cached; Help can clear the named model cache. Voice accuracy varies, especially with crying, quiet speech, noise, accents, or fragmented speech. Tears are not words; every transcription is editable. No emotion diagnosis is attempted.
- Confirmed **Let it go**, intentional opt-in swipe, and breath all use the same bounded ink-particle sequence. Up to 4,200 particles (1,800 on narrow/constrained devices) come from the actual visible letter shapes. Long entries animate their visible region while retaining the full entry for undo.
- Original wind, staggered ink puffs, soft writing textures, and a completion chime accompany the page. Sound is on by default and begins on entry; mute applies to all music/effects. Notebook music softens during breath and pauses for voice typing. Hidden tabs stop microphone capture and sound.
- **100 original supportive quotes** span ten themes. Modest local keyword matching chooses a relevant theme; an in-memory deck randomizes and avoids repetition. Unmatched entries can draw from all 100. This is not a reading of the user's emotions.
- **Bring it back** restores the full writing for 20 seconds. Begin again, returning home, or expiration drops the undo copy. Reduced motion skips travel and uses quiet transitions; missing canvas gets a CSS fade.

## Privacy and limits

Writing is in **temporary tab memory**, not local storage, session storage, cookies, a database, or a file. Refreshing/closing loses it. A browser warning is registered for unreleased drafts, but mobile browsers may omit it. Browsers control memory reclamation and back/forward caching; JavaScript cannot promise forensic erasure.

Breath mode analyzes live sound without saving a recording. Optional voice mode buffers short PCM segments in memory, transcribes them locally, then drops/clears them. Cancelling/unmounting terminates the worker and input tracks. No writing or microphone audio is uploaded or put into model caches. A named browser cache may hold **public speech model files only**; normal HTTP caching is controlled by the browser/host. Browser extensions and the operating system are outside the app's control.

Recognition and breath detection are fallible. The automated suite uses simulated microphone input and a public historical speech clip, including real inference in Brave/Chromium. Actual devices, accents, emotional speech, and physical blowing still require manual testing. Whisp is a symbolic ritual, not treatment or guaranteed relief.

## Implementation and verification

- [Architecture and trade-offs](docs/ARCHITECTURE.md)
- [Tests and manual checklist](docs/TESTING.md)
- [Current feature update](docs/FEATURE_UPDATES.md)
- [Static deployment guide](docs/DEPLOYMENT.md)
- [Licenses and model/fixture attribution](THIRD_PARTY_NOTICES.md)

The reducer owns writing state. `useVoiceWriting` owns capture, bounded jobs, final-block flushing, and cleanup; `speech.worker.ts` owns local inference. The separate breath hook owns detection. `quotes.ts` holds original messages and the local rotation policy. Canvas measures and rasterizes the editor's visible ink. `soundscape.ts` synthesizes the score and effects. No WebGL or animation-library dependency is needed.

## Deployment

`dist/` is a complete static site, including generated speech assets. Configure `whisp.rubangino.ca` with the chosen host's DNS target and valid HTTPS. Ensure it supports the model file sizes and serves `.wasm` and worker modules with correct MIME types. The included `_headers` declares same-origin workers, same-origin connections, and WASM compilation; hosts that ignore this file need equivalent configuration. No server function, API key, database, or cloud speech service is required.

**Do not push to GitHub or deploy without owner approval.** No automatic publishing workflow is installed.
