# Voice, positive notes, and a smoother ritual — October 29, 2026

The owner approved a local commit of these completed changes on October 29, 2026. GitHub push and production deployment are not authorized or performed for this update.

- Private English voice typing works in Brave through a self-hosted Whisper Tiny model and WASM worker. It appends recognized phrases without replacing typed writing, pauses music/breath release while speaking, flushes the final audio block on Finish, and waits for recognition before release. No audio is uploaded. A clear first-use note explains the roughly 70 MB model/runtime transfer and public-asset caching.
- Exactly 100 original supportive quotes, ten themes, local keyword hints, and randomized rotation without immediate repetition. A note materializes after the ink disappears, with a soft completion chime. This does not diagnose emotion or promise relief.
- Wind, small ink puffs, and subtle writing textures are synthesized locally and follow the release choreography. The existing sound toggle mutes all music and effects.
- The homepage fits a normal device viewport including header/footer, with refined copy. Typography adapts to width and height; extremely short or zoomed layouts retain scrolling for access to controls.
- The notebook appears beneath the final portal glow before arrival. The glow morphs into the paper's actual bounds and fades, preventing the sudden page swap. Skip and reduced motion remain available.
- Help distinguishes temporary writing/audio memory from cached public model assets and offers a focused model-cache clear action. Model assets are reconstructed before build; no backend/API keys are needed.

Automated tests include real recognition of a public historical speech clip in Brave and Chromium, as well as simulated capture, pending-job/cancellation behavior, quote count/relevance/rotation, viewport fitting, portal continuity, offline audio output, and accessibility. Physical microphones, emotional speech, and real phone performance remain owner manual checks.
