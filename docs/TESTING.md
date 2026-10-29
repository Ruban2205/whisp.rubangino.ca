# Whisp verification and owner test checklist

## Automated checks

The automated suite uses Vitest and Playwright. The default browser matrix targets desktop Chromium, Firefox, WebKit, Pixel 7 emulation in Chromium, and iPhone 13 emulation in WebKit. An optional project also runs the installed Brave executable in a fresh isolated profile; the final run included it. Emulation does not verify an actual phone, mobile operating system, physical microphone, or branded Safari/Edge installation.

The responsive matrix covers 280–1920px widths, including 320×400 zoom-like, 568×320 and 844×390 landscape, tablets, and expanded voice/Help content. Axe checks run on the landing page, notebook, and completion. Browser tests include scripted microphone signals and resource tracking, not recorded user audio.

Verified locally on October 29, 2026:

| Check | Result |
| --- | --- |
| Strict TypeScript + production build | Passed |
| Vitest | 29 / 29 passed |
| Playwright | 320 passed, 4 intentionally skipped out of 324 cases across six projects, including Brave |
| Axe on landing, notebook, completion, and Help | No violations detected in the automated matrix |
| Production browser smoke | Chromium, Firefox and WebKit passed: pre-rendered/no-JS content, hydration under CSP, mobile writing/release/undo, metadata and asset responses |
| Production network/storage inspection | No third-party requests, no local/session storage, no cookies in the tested flow |
| Visual captures | Homepage, portal-to-paper docking, notebook, release, positive-note completion, phone landing, and sharing image inspected |
| Browser runtime errors in visual/production runs | None detected |
| Git whitespace check | Passed |
| Real speech inference | Silent PCM rejected; public fixture recognized through the editor in Brave and Chromium; compiled worker also passed under the production CSP with zero external requests |
| Physical microphones, emotional speech, actual phones, screen readers | Pending manual testing |

During the earlier follow-up, an initial four-worker run had one intermittent Firefox AudioContext-resume timeout in the simulated hidden-tab test. Three isolated repeats passed, and both that follow-up’s final matrix and the production-preparation matrix passed with no retries. No reproducible product regression was identified.

The production JavaScript bundle is approximately 90.5 kB gzip, with CSS approximately 9.2 kB gzip; fonts, sharing assets, and optional speech assets are separate. The lazy speech worker is about 888 kB before compression; first voice use loads roughly 70 MB of model/runtime files, with no user audio upload. This is a bundle-size observation, not a measured physical-device FPS claim.

Re-run the production smoke check with `npm run preview` in one terminal and `node scripts/verify-production.mjs` in another. `WHISP_PREVIEW_URL` can select a different local preview origin. Static-host headers and TLS cannot be verified until an approved deployment exists.

Four real-inference cases are explicitly skipped on Firefox/WebKit/mobile projects: the actual CPU model fixture is tested on desktop Brave and Chromium, while all six projects test capture orchestration with a simulated recognizer. These skips do not claim physical-device speech validation.

The updated suite additionally checks the default microphone preference and permission timing, opt-out across repeat sessions, simulated soft breath and low-frequency wind, input feedback, sensitivity/recalibration, default sound and mute, entry-to-notebook music transition, and offline audio rendering (audible output with bounded peaks, including ducking during breath). No physical microphone was used in automated tests. The new suite also verifies 100 unique quotes, local theme matching and rotation, append-only speech edits, pending recognition/cancellation, model-cache clearing, homepage height, portal paper continuity, offline wind/puff/chime/return output, non-speech annotation cleanup, automatic cache deletion/failure handling with undo preservation, and reverse navigation/skip/focus.

## Manual release checklist

- [ ] Open the landing page. Sound and the microphone option should be selected by default, with no audio or permission prompt until entry. Check composition, typography, stars, and parallax.
- [ ] Enter and watch the full journey. Repeat and try Skip journey. Rapidly tap Enter: it should remain a single journey.
- [ ] Write, paste, select, cut, backspace, undo/redo, and add multiple paragraphs.
- [ ] Test accents, emoji, Japanese/Chinese, Arabic/Hebrew, and your preferred input method/IME. Text must stay editable and intact. Mixed-direction lines and tabs may differ slightly between textarea and canvas shaping; report any visible jump.
- [ ] Paste a long entry and scroll to its middle/end. Release should animate the visible region and restore the entire entry with Bring it back.
- [ ] Press Let it go once: nothing should be erased. Confirm within five seconds; wait longer to confirm the lightweight confirmation resets.
- [ ] Watch the particles: they should begin at actual writing, flow gently right/up, then settle. No flashes or shaking.
- [ ] Bring it back before 20 seconds. Verify exact restoration. Release again; wait for expiry and verify undo is gone.
- [ ] Begin again and Return to the stars. Check focus and empty-page behavior.
- [ ] Enable swipe mode, cancel it, re-enable it, and deliberately swipe right. Ordinary editor scrolling and selection must not release anything.
- [ ] Open/close privacy with keyboard and touch. Tab should stay within the modal. Escape should close it and return focus.
- [ ] Enable reduced motion at the OS/browser level. Travel should be skipped; ink should fade quietly without moving particles.
- [ ] Enter with sound on: hear the cosmic chime, then a soothing sustained notebook score. Toggle off/on, skip the journey, return home, and background the tab. Sound should stop on hidden tabs and offer an explicit Resume sound action on return. Confirm the music softens during a sustained breath.
- [ ] Write then try refreshing/closing. If your browser supports beforeunload prompts, it should warn. Mobile platforms may omit this warning; the page explicitly explains loss.
- [ ] Inspect DevTools Network and storage. No user text/audio should leave the tab; local/session storage and cookies should remain empty.

## Real microphone validation (not yet performed)

Test separately on desktop Brave, desktop Chrome, desktop Safari, Firefox, Edge, iPhone Safari, Android Chrome, and iPad Safari when available. Record browser/OS/device, ambient noise, distance, and result. Do not record private writing or microphone audio.

- [ ] No browser permission prompt on page load. Confirm the entry note explains microphone permission and offers an opt-out.
- [ ] Enter with the microphone option checked; allow browser permission. It should be visibly on when the notebook opens, even before writing. An empty draft cannot release. Repeat with the option unchecked; there should be no request. Use my breath should still enable it manually.
- [ ] Stay quiet during the approximately 1.2-second calibration. Confirm the UI changes from calibrating to listening.
- [ ] Write, then blow gently near the actual microphone for about one second. Check both input level and sustained progress. Try Gentle breath sensitivity and Recalibrate. There should be no need to exhaust your breath.
- [ ] Try quiet speech, normal speech, a single tap/clap, desk movement, music, and room noise. These should normally not release. Whispered speech or sustained broadband sounds can resemble breath; detection is not infallible.
- [ ] Try different microphone distances, headset microphones, laptop microphones, and noisy rooms. If calibration includes a loud sound, stop and retry in a quieter moment.
- [ ] Deny permission, block permission in settings, remove/disconnect the microphone, and keep it busy in another app. Drafts must survive; manual release must work.
- [ ] Stop listening while calibration is active and while the browser prompt is pending. A late granted stream must be stopped.
- [ ] Switch tabs/lock the device. Listening must stop and the browser microphone indicator must clear.
- [ ] Manually release while listening. Verify microphone tracks stop and no second release occurs.
- [ ] Verify there is no microphone feedback, recording, transcription, or audio upload.

## Device, performance, and accessibility checks

- [ ] On actual phones: test portrait/landscape, notches/safe areas, virtual keyboard open/closed, scroll, and swipe. Controls should remain reachable with no sideways overflow.
- [ ] Test 200% browser zoom, increased text size, keyboard-only navigation, and OS high contrast where available.
- [ ] Use VoiceOver or NVDA to confirm editor labels, microphone state, completion focus, privacy dialog, and confirmation are understandable. Automated axe checks do not replace this.
- [ ] On a lower-powered phone, use the Performance panel during release. Target smooth animation; actual 60 FPS is not guaranteed or yet measured on physical devices.
- [ ] Run several writing/release/undo cycles and inspect memory and active audio tracks for growth.
- [ ] Validate the deployed HTTPS site and security headers after deployment approval; localhost testing alone does not verify host configuration.

## Approval record

The owner previously reported a Brave breath-detection failure. After the detector, voice, guidance, cache, responsiveness, and return updates, the owner confirmed “Everything works fine” and authorized the complete GitHub commit/push. This is a general functional acceptance, not a claim that every device or assistive-technology item below was exercised. Deployment is an owner action; live HTTPS/host verification remains pending.


## New-feature manual review

- [ ] On localhost in Brave, enter the notebook and choose **Speak your thoughts**. Read the first-use download/cache note, then enable it. Verify that no words are lost from an existing typed draft.
- [ ] Speak a few English phrases, pause naturally, and check the editable transcription. Try quiet speech, accents, pauses, and emotional speech without assuming perfect accuracy. Tears/non-speech should not be treated as reliable words.
- [ ] Click **Finish voice typing**. Check that the last word completes, pending phrases finish, and breath listening returns if it was selected. Verify that talking during voice mode cannot accidentally release the page.
- [ ] Blow gently or confirm manual release. Listen for wind and ink puffs, then watch a supportive quote appear. Try different topics and repeated releases to check relevance/rotation.
- [ ] Cancel voice typing, deny permission, hide the tab, and interrupt model loading. Written text must survive; microphone tracks should stop. Check memory on repeated voice sessions, particularly on a phone.
- [ ] In Help, verify the distinction between draft memory and public speech-model cache. Clear the model cache and try voice typing again. Do not expect local storage or a saved draft to exist.
- [ ] Check the invitation fits your viewport with header/footer visible. Watch the full journey and verify that the warm glow resolves into the paper without a sudden scene swap. Check Skip and reduced motion too.


## Follow-up device review

- [ ] Speak through quiet pauses and background music. Non-speech labels such as `[Music]` and `Blank Audio` should not enter the notebook. Meaningful speech about music/crying and manually typed labels should remain editable.
- [ ] Read the instruction above the page without opening Help. Try writing, voice input, Finish voice typing, breath release, and the manual alternative. Report anything that takes effort to discover.
- [ ] In Brave DevTools, inspect Cache Storage after voice use and after successful release. The `whisp-voice-model-v1` cache should disappear automatically; unrelated caches should remain. Try voice input again and expect a possible download. Check Help’s clear action and explanation.
- [ ] From an empty notebook and from completion, return home. Watch the paper expand into light and recede into stars; try Skip return and reduced motion. Enter should become active after return, with no lost unfinished draft.
- [ ] On real phones, test portrait/landscape, large text/zoom, and the virtual keyboard. Open the voice notice, microphone troubleshooting, and Help; every action should remain reachable.

The automatic model-cache operation does not erase browser-managed app-code caches, guarantee secure memory wiping, or delete server build assets. Writing/audio are never stored in the model cache. Deployment and Vercel plan eligibility remain unverified until separately approved.


## Production preparation verification

The source release includes pre-rendered landing HTML, safe React hydration with reduced-motion preferences, production canonical/share/schema metadata, developer identity, a complete favicon set, and static cache/security settings. `npm run build` runs a release artifact gate; `npm run verify:release` can repeat it without rebuilding.

`verify-production.mjs` applies the production security headers locally and checks runtime/console errors, one heading after hydration, release/restore, storage, metadata/icon responses, and public content with JavaScript disabled. `WHISP_BROWSER` selects Chromium (default), Firefox, or WebKit. These checks simulate host policy; they cannot prove live DNS, TLS, account limits, or deployed headers before the owner deploys.

The production dependency audit reports zero known vulnerabilities at verification time. GitHub Actions is configured for unit/build validation with read-only repository permissions and no deployment job. Its remote result is separate from the locally executed checks.

Final production-preparation results: **29 unit tests passed; 320 browser checks passed with four intentional real-inference skips; production smoke passed in Chromium, Firefox, and WebKit; compiled local speech under CSP passed; production dependency audit found zero known vulnerabilities.** No production deployment has been performed.
