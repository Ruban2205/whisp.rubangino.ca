# Microphone access and recovery

Research and implementation: October 30, 2026. The owner approved committing this update locally on main on October 30, 2026. GitHub push and deployment have not been performed for this update.

## Why a blocked browser can seem silent

A microphone request can reject with `NotAllowedError` when access is denied at the site, browser, operating-system, or policy level. It does not guarantee another native permission prompt. The error alone does not identify which layer blocked access. The Permissions API can sometimes report an existing denial, but support for the microphone descriptor varies; an unsupported query must not prevent the real request.

Whisp now presents an accessible dialog after a denied request from entry, Use my breath, or private voice typing. It gives local device suggestions (including iPad desktop browsing), a selectable iPhone/iPad/Android/computer guide, official support links, Try again, and Keep writing without microphone. A first-time visitor still receives no microphone request or modal before choosing entry/input. An entry denial is explained immediately, even while the cosmic journey is running.

## Recovery behavior

- Try again repeats the input action the user selected: breath listening or voice typing. There is no automatic retry loop or automatic reload.
- Continuing, closing, or pressing Escape stops input, keeps the draft, returns focus to writing when available, and opts out of automatic breath listening on subsequent notebook cycles. The user can enable it explicitly again.
- For voice typing, an available read-only permission query avoids model downloads when access is already known to be denied. Unsupported queries fall back to the ordinary capture request. Voice model/capture resources are cleaned up on failure.
- Late denied requests after Stop/cancellation do not reopen the dialog. Missing hardware and model errors remain separate from permission failures.
- The app cannot enable the browser/OS setting itself. Menu names differ across devices and versions. An OS privacy switch that supplies silent audio instead of rejecting access cannot be reliably distinguished from a quiet room; this is not reported as a confirmed permission denial.
- Drafts remain in tab memory. Whisp does not reload during recovery; an actual browser reload, tab termination, or closing still loses the draft. No transcript, audio, or device-help selection is saved or uploaded.

## Primary references

- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — permission failures, secure contexts, and requests that may remain unanswered.
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) — read-only permission status and differences in supported descriptors.
- [Google Chrome: camera and microphone on Android](https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DAndroid) — per-site blocks and app permission recovery.
- [Apple: Safari privacy and website settings](https://support.apple.com/guide/iphone/iphb01fc3c85/ios) — Safari microphone Ask/Deny/Allow controls; newer systems place Safari under Settings → Apps.
- [Apple: control access to hardware features](https://support.apple.com/guide/iphone/iph168c4bbd5/ios) — iPhone/iPad app microphone privacy controls.
- [Google: app permissions on Pixel](https://support.google.com/pixelphone/answer/6293419) and [Android microphone privacy switch](https://support.google.com/android/answer/13532937?hl=en) — device/app access controls.
- [Brave: site permissions](https://support.brave.app/hc/en-us/articles/360018205431-How-do-I-change-site-permissions) — browser settings help.

## Manual device checks

Automated cases simulate permission states and streams; they do not operate a physical phone's Settings app. Check real iPhone Safari/Brave and Android Chrome/Brave: pre-block the website, disable browser app permission, try entry and voice input, follow the guide, allow access, return and retry. Confirm draft retention when the browser keeps the tab alive, and verify quiet/manual release after choosing to continue without access. Also check labels on the actual OS/browser version and any device-wide microphone switch.

## Verification

34 unit tests and the full six-profile browser matrix passed (380 passed, four intentional real-inference skips). Compiled permission recovery passed in Chromium, Firefox, and WebKit under the production CSP. Accessibility, 280px widths, short landscape screens, draft/focus retention, retry after enabling permission, and unsupported Permissions API behavior were checked. No physical device settings were changed in automated testing.
