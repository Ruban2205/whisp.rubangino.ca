# Local feature and bug-fix update — October 29, 2026

The owner approved committing and pushing this update to GitHub on October 29, 2026. Production deployment is not authorized or performed. Physical microphone re-test results have not been reported.

- Microphone is selected by default. The landing page explains the permission request and offers an opt-out. Enter requests permission; listening/calibration begins in the notebook. Empty writing cannot release.
- Breath detection now accepts soft broadband breath and low-frequency turbulent wind. The previous detector excluded much of the low-frequency energy and required a strong hiss. Quiet calibration uses a lower percentile to avoid an early puff inflating the threshold. Pitch autocorrelation and sustained confidence still reject common speech and short impulses. An input meter, Gentle breath sensitivity, and Recalibrate provide practical feedback and recovery.
- Sound is on by default, beginning on the entry click. An original ascending cosmic chime accompanies the longer 8.8-second journey. Notebook music uses slow chords, soft sustained voices, and sparse bell notes. Playback softens during breath and stops on hidden tabs; mute/resume remain available.
- Help explains that writing stays in temporary tab memory, never local storage or session storage. It explains refresh/close, the 20-second undo copy, restart clearing, browser memory/cache limitations, microphone privacy, and Brave permissions.
- Verification: 17 unit tests, 174 browser tests across six projects including installed Brave, strict TypeScript, production build, production privacy/release smoke, and visual review passed. Audio tests render the original score locally to verify non-silent output and bounded peaks.

Physical breath detection on the owner's Brave setup remains pending. Re-test with a short gentle puff after writing and waiting for Listening; inspect the input meter before trying stronger breath. The detector is a heuristic, not an infallible breath/speech classifier.
