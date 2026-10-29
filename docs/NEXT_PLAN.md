# Next update plan — October 29, 2026

Historical implementation plan. Baseline committed locally as `a73faf0`. The owner has now reviewed the follow-up, confirmed it works, and authorized committing/pushing the complete release; deployment remains an owner action.

1. Filter only recognized non-speech annotations (Blank Audio, Music, silence, similar bracketed labels). Preserve meaningful speech about music/crying and never alter keyboard-entered text. Add silence protection and regression tests.
2. Make the next action clear at the top of the notebook. Explain writing/speaking, finishing voice input, and a comfortable breath directed toward the device microphone. Keep secondary microphone tuning in optional troubleshooting.
3. Clear the app-owned speech-model cache after successful release and on returning home. Stop workers first, leave undo intact, preserve unrelated caches, and explain the possible re-download. Avoid HTTP storage of model downloads where controlled by the app/host.
4. Add an explicit return state and a reversed paper → glow → starfield journey, with reduced-motion and skip behavior. Ignore repeated navigation clicks and preserve nonempty-draft guards.
5. Verify compact, portrait, tablet, desktop, landscape, and zoom-like layouts. Allow scrolling where the viewport is too short to contain all usable controls; never clip writing/actions.
6. Prepare Vercel static configuration and document free-plan conditions without publishing. Run targeted tests, the browser matrix, actual local speech-fixture checks, production build/CSP checks, and visual QA.

## Research

- Vercel Hobby is limited to personal, non-commercial use: https://vercel.com/docs/plans/hobby and https://vercel.com/docs/limits/fair-use-guidelines . A free-to-use branded business project is not automatically non-commercial.
- Static asset downloads count toward Fast Data Transfer; Hobby currently includes 100 GB: https://vercel.com/docs/manage-cdn-usage . Re-downloading a speech model after cache clearing uses bandwidth; there is no server speech-inference bill in this architecture.
- Vercel's documented 100 MB Hobby CLI upload limit concerns source uploads, not proof that every build output is limited to that size: https://vercel.com/docs/limits . Generated speech assets are already excluded from Git and prepared during build.
- Custom headers/build/output settings are supported in vercel.json: https://vercel.com/docs/project-configuration . Keep same-origin-only inference assets, worker/WASM CSP, and correct content types.
- Non-speech hallucinations are a known ASR limitation; filtering labels is useful but is not a claim of perfect recognition: https://www.isca-archive.org/interspeech_2025/wang25b_interspeech.pdf . Regressions must distinguish annotations from ordinary spoken sentences.


## Completion record

All six implementation steps are complete and owner reviewed. They are included in the authorized production-preparation source release. No deployment has been performed.

- TypeScript and production build passed; 29 unit tests passed.
- Final Playwright run: 314 passed, four intentional real-inference skips, across Brave, Chromium, Firefox, WebKit, and two phone-emulation profiles. No retries in the final run.
- Compiled speech worker rejected silence and recognized the public test clip under production CSP, with zero external requests. Production writing/release/undo/privacy smoke passed.
- Updated desktop, mobile, notebook, completion, and reverse-journey captures were inspected; no captured runtime errors. Vercel header parity/static-output/no-store configuration checked locally, without deploying.
- Local development server remains available on port 5173; temporary production preview was stopped. Actual microphone, emotional-speech, physical-device, and assistive-technology checks remain owner tests.
