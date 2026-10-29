# Implementation decisions

Whisp is a static Vite + React + TypeScript application. No server, cookies, storage, analytics, AI APIs, runtime font services, or credentials are needed.

- An explicit reducer owns the ritual: landing → entering → writing → releasing → complete. Entry and release callbacks cannot advance an unrelated stage. Text remains intact until the animation reports completion. A failed animation restores editing.
- Canvas 2D renders original cosmic artwork and particles. This keeps the bundle small and avoids WebGL contexts, shader compilation, and a second renderer fallback. CSS provides a quiet fallback when canvas is unavailable. CSS handles portal choreography; requestAnimationFrame handles the continuous effects. No animation library is needed.
- A native textarea handles writing, IME, selection, undo, mobile keyboards, and scrolling. At release, a temporary DOM mirror measures browser-wrapped text (including grapheme clusters); an offscreen canvas renders the visible lines using the editor's actual font and metrics. Sampled ink pixels seed bounded particle arrays. Only the visible region is animated for long entries; the full entry is retained for undo.
- Breath detection uses local RMS, spectral flatness, low/high energy distribution, crest factor, and sustained confidence with adaptive background calibration. It is a heuristic, not a speech classifier. Calibration needs quiet; loud fans, whispered speech, or unusual microphones can fool it. Listening is explicit, stoppable, and ends on release, hidden tabs, disconnect, or unmount. All release methods share the same sequence and undo.
- Reduced motion skips camera travel and uses a short ink fade rather than particle movement. Sound is optional, off by default, and synthesized locally.
- Released text is held in reducer memory for 20 seconds. Beginning again, returning home, or expiration drops that reference. The textarea is remounted after completion to discard its native edit history before a new draft. JavaScript does not offer guaranteed secure memory wiping. Drafts are lost on refresh; beforeunload warns while an unreleased draft exists, subject to browser support.
- Fonts are bundled through Fontsource. Caveat is used for handwriting; system fonts cover unsupported scripts. Cormorant Garamond and DM Sans provide editorial and interface typography. Their OFL licenses ship in the font packages and are included in the project notices.

## Performance budget

Starfield: <= 220 stars on desktop / 95 on narrow screens or devices reporting <= 4 logical cores. Ink: <= 4,200 particles on desktop / 1,800 on narrow screens or those devices, sampled from a viewport-sized canvas. Canvas DPR capped at 1.5–2. No full-document rasterization or per-character live editor DOM. Hidden-page animation pauses. FPS is a target, not a verified device guarantee.
