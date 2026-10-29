# Voice, positive notes, and a smoother ritual — October 29, 2026

The initial voice/quote update was committed locally as `a73faf0`. The owner subsequently confirmed the app works and authorized committing and pushing the complete release. Deployment remains an owner action.

- Private English voice typing works in Brave through a self-hosted Whisper Tiny model and WASM worker. It appends recognized phrases without replacing typed writing, pauses music/breath release while speaking, flushes the final audio block on Finish, and waits for recognition before release. No audio is uploaded. A clear first-use note explains the roughly 70 MB model/runtime transfer and public-asset caching.
- Exactly 100 original supportive quotes, ten themes, local keyword hints, and randomized rotation without immediate repetition. A note materializes after the ink disappears, with a soft completion chime. This does not diagnose emotion or promise relief.
- Wind, small ink puffs, and subtle writing textures are synthesized locally and follow the release choreography. The existing sound toggle mutes all music and effects.
- The homepage fits a normal device viewport including header/footer, with refined copy. Typography adapts to width and height; extremely short or zoomed layouts retain scrolling for access to controls.
- The notebook appears beneath the final portal glow before arrival. The glow morphs into the paper's actual bounds and fades, preventing the sudden page swap. Skip and reduced motion remain available.
- Help distinguishes temporary writing/audio memory from cached public model assets and offers a focused model-cache clear action. Model assets are reconstructed before build; no backend/API keys are needed.

Automated tests include real recognition of a public historical speech clip in Brave and Chromium, as well as simulated capture, pending-job/cancellation behavior, quote count/relevance/rotation, viewport fitting, portal continuity, offline audio output, and accessibility. Physical microphones, emotional speech, and real phone performance remain owner manual checks.


## Follow-up update — owner reviewed and approved

- Suppress recognized non-speech annotations and skip near-silent audio decoding. Preserve meaningful sentences about music/crying and all keyboard-entered writing. This reduces a known ASR failure mode; it does not guarantee perfect transcription.
- Put the write/speak → Finish voice typing → gentle breath instructions above the notebook, with a manual release alternative. Hide secondary microphone tuning in optional troubleshooting.
- Automatically clear only the app’s public speech-model cache after a successful release or return home. Stop voice workers first; preserve writing undo and unrelated caches. Report deletion failures and offer Help retry. A later voice session can download the model again.
- Reverse the paper → glow → universe journey on return home, with descending sound, Skip return, reduced motion, guarded navigation, and focus restored to Enter.
- Support narrow 280px layouts, short/landscape viewports, and expanded voice/Help content. Scrolling preserves access on short screens.
- Prepare Vercel static-build/security/cache settings and document conditional Hobby eligibility and bandwidth costs. No deployment performed.


## Production preparation and identity

- Production canonical identity: `https://whisp.rubangino.ca/`. Developer and publisher links point to Ruban AI Labs at `https://labs.rubangino.ca/`.
- Rewritten project README with installation, features, privacy, validation, production settings, and documentation links.
- Pre-rendered public landing HTML with hydration; reduced-motion state is safe across server rendering and hydration. No personal notebook content is rendered at build time.
- Descriptive SEO/share metadata, WebSite/WebApplication/Organization structured data, sitemap, robots, and a launch verification guide. No fabricated ratings or guaranteed traffic claims.
- Original gold W/star SVG logo plus ICO, search PNG, Apple touch, and application icons; manifest uses ordinary browser display.
- Build-time release verification, Node 24 configuration, security/cache parity, and GitHub Actions unit/build validation. No publishing job or deployment credentials added.

Release validation: 29 unit tests, 320 browser checks (four intentional inference skips), three production browser smoke checks, compiled local speech/CSP verification, artifact verification, visual review, and zero known production dependency vulnerabilities. Owner deployment remains the next step.
