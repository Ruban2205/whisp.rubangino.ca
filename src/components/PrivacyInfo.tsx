import { useEffect, useRef, useState } from 'react'
import { clearSpeechModelCache } from '../lib/speechCache'
import { Icon } from './Icon'
export function PrivacyInfo({ close, voiceBusy }: { close: () => void; voiceBusy: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [cacheMessage, setCacheMessage] = useState('')
  const clearModel = async () => {
    const result = await clearSpeechModelCache()
    setCacheMessage(result === 'failed' ? 'The model cache could not be cleared here. You can remove this site’s cached files in your browser settings.' : result === 'unavailable' ? 'This browser does not offer an app speech-model cache.' : 'Speech model cache cleared. Voice typing may download it again next time.')
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    const element = dialog.current
    return () => { element?.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="privacy-inner">
      <button className="icon-button privacy-close" aria-label="Close help" onClick={close}><Icon name="close" /></button>
      <Icon name="lock" size={25} />
      <p className="eyebrow">HELP & YOUR PRIVACY</p>
      <h2 id="privacy-title">Only in this tab.<br />Only for now.</h2>
      <h3>Where do my words go?</h3>
      <p>Your writing lives in this tab’s temporary memory. We do not put it in local storage, session storage, cookies, a database, or a file. We don’t send your words or audio to a server or cloud AI.</p>
      <h3>When is it cleared?</h3>
      <ul className="privacy-facts">
        <li><strong>Refresh or close this page:</strong> your current writing is lost. There is no saved draft to recover.</li>
        <li><strong>Let it go:</strong> the page clears after the animation. A temporary copy stays in memory for 20 seconds so you can choose “Bring it back.”</li>
        <li><strong>Begin again, return home, or wait 20 seconds:</strong> the app drops that temporary copy too.</li>
      </ul>
      <p>Browsers control how memory is reclaimed and may retain a page in a back/forward cache. We can’t promise secure memory erasure. Refresh to start a fresh page; don’t rely on simply navigating away to destroy a browser-cached tab.</p>
      <h3>Can I speak instead of typing?</h3>
      <p>Choose Speak your thoughts, then Enable private voice typing. An English speech model runs on your device and appends recognized phrases to the page. Audio stays in temporary memory and is discarded after processing or cancellation. There are no audio uploads. Tears and unclear speech may not produce words; you can edit everything.</p>
      <p>Voice typing loads about 70 MB of model/runtime files from this site on first use. Only these reusable speech assets use the app’s model cache. Whisp automatically clears that cache after a successful release or when you return to the stars. Your writing and microphone audio are never put there. A later voice session may need to download the model again. Browser-managed caches of ordinary app files are separate. Music and breath release pause while you speak. Choose Finish voice typing, check the words, then blow gently to release.</p>
      <button className="quiet-button" disabled={voiceBusy} onClick={() => void clearModel()}>Clear speech model cache now</button>
      <p role="status">{voiceBusy ? 'Finish voice typing before clearing its model cache.' : cacheMessage}</p>
      <h3>How is the positive note chosen?</h3>
      <p>Whisp holds 100 original supportive quotes. Words on the page help choose a relevant theme locally, and a random note appears after release. This is a simple hint, not a reading of your emotions. We keep only quote IDs to avoid repeats, never a profile of you.</p>
      <h3>How do microphone and sound work?</h3>
      <p>The microphone option is on by default. When you choose “Enter your space,” your browser asks permission. You can uncheck it before entering or stop listening in the notebook. Breath mode analyzes live sound on your device without saving a recording. Voice mode temporarily buffers short segments as described above. Neither mode uploads your audio.</p>
      <p>Write first, wait for “Listening,” then blow gently near your microphone for about a second. Watch the input meter. Try “Gentle breath” sensitivity or Recalibrate if needed. Fans, music, and speech can confuse detection; the confirmed Let it go button always works without a microphone.</p>
      <p>Using Brave? Check this site’s microphone permission and your system’s microphone permission, and make sure you’re using the microphone you’re blowing toward. <a href="https://support.brave.app/hc/en-us/articles/360018205431-How-do-I-change-site-permissions" target="_blank" rel="noreferrer noopener">Brave’s permission guide ↗</a></p>
      <p>Sound is on by default and starts when you enter: a soft cosmic chime, followed by calm notebook music composed by the app, soft writing sounds, and wind as your ink drifts away. Mute it from the sound control. The music softens while you breathe. Headphones can help keep playback out of the microphone.</p>
      <p className="privacy-note">No accounts or trackers. Closing or refreshing loses your draft; browser warnings are not available everywhere. Whisp is a symbolic ritual, not treatment or a promise of relief.</p>
      <button className="quiet-button" onClick={close}>Back to my space <Icon name="arrow" size={16} /></button>
    </div>
  </dialog>
}
