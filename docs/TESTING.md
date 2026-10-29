# Whisp verification and owner test checklist

## Automated checks

The automated suite uses Vitest and Playwright. The default browser matrix targets desktop Chromium, Firefox, WebKit, Pixel 7 emulation in Chromium, and iPhone 13 emulation in WebKit. An optional project also runs the installed Brave executable in a fresh isolated profile; the final run included it. Emulation does not verify an actual phone, mobile operating system, physical microphone, or branded Safari/Edge installation.

The responsive matrix uses 320, 375, 390, 768, 1024, 1440, and 1920px. Axe checks run on the landing page, notebook, and completion. Browser tests include scripted microphone signals and resource tracking, not recorded user audio.

Verified locally on October 29, 2026:

| Check | Result |
| --- | --- |
| Strict TypeScript + production build | Passed |
| Vitest | 17 / 17 passed |
| Playwright | 174 / 174 passed in one final run across six projects, including installed Brave |
| Axe on landing, notebook, completion, and Help | No violations detected in the automated matrix |
| Production Chromium mobile smoke | Passed: writing, release, undo, metadata and asset responses |
| Production network/storage inspection | No third-party requests, no local/session storage, no cookies in the tested flow |
| Visual captures | Desktop landing, notebook, release, phone landing, and sharing image inspected |
| Browser runtime errors in visual/production runs | None detected |
| Git whitespace check | Passed |
| Physical microphones, actual phones, screen readers | Pending manual testing |

The production JavaScript bundle is approximately 81.4 kB gzip, with CSS approximately 6.6 kB gzip; fonts and sharing assets are separate. This is a bundle-size observation, not a measured physical-device FPS claim.

Re-run the production smoke check with `npm run preview` in one terminal and `node scripts/verify-production.mjs` in another. `WHISP_PREVIEW_URL` can select a different local preview origin. Static-host headers and TLS cannot be verified until an approved deployment exists.

The updated suite additionally checks the default microphone preference and permission timing, opt-out across repeat sessions, simulated soft breath and low-frequency wind, input feedback, sensitivity/recalibration, default sound and mute, entry-to-notebook music transition, and offline audio rendering (audible output with bounded peaks, including ducking during breath). No physical microphone was used in automated tests.

## Owner testing before GitHub push

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

Owner reports: **blowing failed in Brave on the baseline**. The detector and permission flow have been revised; physical re-test is pending. GitHub push for these updates: **explicitly approved by the owner on October 29, 2026**. Production deployment: **not authorized yet**. Physical microphone/device and assistive-technology checks remain pending unless the owner reports their results.
