export const errorPages = {
  '403': { code: '403', eyebrow: 'A QUIET BOUNDARY', title: 'This corner is out of reach.', message: 'This page isn’t available to you. Your little space is still waiting back among the stars.', retry: false },
  '404': { code: '404', eyebrow: 'A LITTLE OFF COURSE', title: 'Some stars are still undiscovered.', message: 'We couldn’t find this page. Follow the light back to your own little space.', retry: false },
  '408': { code: '408', eyebrow: 'TAKE YOUR TIME', title: 'The moment slipped away.', message: 'This request took too long. Take a breath, then try the journey again.', retry: true },
  '429': { code: '429', eyebrow: 'A MOMENT OF STILLNESS', title: 'Even stars need a pause.', message: 'There have been a few too many requests. Give this space a moment before trying again.', retry: true },
  '500': { code: '500', eyebrow: 'THE LIGHT WILL FIND ITS WAY', title: 'A pause in the stars.', message: 'Something interrupted this space. Take a moment, then try again.', retry: true },
  '503': { code: '503', eyebrow: 'RESTING FOR A MOMENT', title: 'The universe is catching its breath.', message: 'This space is temporarily unavailable. Come back in a little while; your next moment can wait.', retry: true },
  '504': { code: '504', eyebrow: 'A LONGER JOURNEY', title: 'The light is taking its time.', message: 'This connection took longer than expected. Please try again in a moment.', retry: true },
  offline: { code: 'OFFLINE', eyebrow: 'STILL HERE WITH YOU', title: 'A quiet moment offline.', message: 'The connection has drifted. You can keep writing on this page. Voice typing may need a connection to load.', retry: false },
  runtime: { code: 'A LITTLE PAUSE', eyebrow: 'LET’S FIND OUR WAY BACK', title: 'The breeze paused.', message: 'Something interrupted the page. We’ll help you return to your space.', retry: true },
  startup: { code: 'NOT QUITE THERE', eyebrow: 'A LIGHT ON THE HORIZON', title: 'Your space hasn’t opened yet.', message: 'Part of the page couldn’t load. Check your connection, then try opening your space again.', retry: true },
  voice: { code: 'VOICE INPUT', eyebrow: 'YOUR WORDS CAN STILL BE WRITTEN', title: 'Your voice needs a moment.', message: 'Voice typing couldn’t finish this time. Your writing is still on the page. Try again, or keep writing quietly.', retry: true },
  microphone: { code: 'BREATH INPUT', eyebrow: 'THERE IS ANOTHER WAY', title: 'The breeze couldn’t reach us.', message: 'The microphone couldn’t stay connected. Your words are still here. Try again, or use Let it go when you’re ready.', retry: true },
  release: { code: 'A GENTLER WAY', eyebrow: 'NOTHING HAS BEEN LET GO YET', title: 'The breeze needs a moment.', message: 'The release animation paused. Your words are still on the page. You can return to writing and try again.', retry: false },
  audio: { code: 'A QUIETER MOMENT', eyebrow: 'YOUR SPACE IS STILL HERE', title: 'The sound drifted away.', message: 'Audio couldn’t start. Try sound again, or continue in a little quiet.', retry: true },
} as const
export type ErrorKind = keyof typeof errorPages
// Only host status documents are emitted as public files. Other designs render in-app.
export const staticErrorKinds = ['403', '404', '408', '429', '500', '503', '504'] as const
export const recoverableErrorKinds = ['voice', 'microphone', 'release', 'audio'] as const
export type RecoverableErrorKind = typeof recoverableErrorKinds[number]
