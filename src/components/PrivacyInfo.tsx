import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
export function PrivacyInfo({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    const element = dialog.current
    return () => { element?.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className="privacy-inner">
      <button className="icon-button privacy-close" aria-label="Close privacy information" onClick={close}><Icon name="close" /></button>
      <Icon name="lock" size={25} />
      <p className="eyebrow">JUST BETWEEN YOU & THE PAGE</p>
      <h2 id="privacy-title">A space that keeps<br />nothing.</h2>
      <p>Your words stay in this tab. No accounts, cookies, trackers, servers, or AI processing. We don’t save your writing.</p>
      <p>If you choose the microphone, audio is analyzed on your device to detect breath. It is never recorded or uploaded. Listening is always visible and you can stop it at any time.</p>
      <p>After release, “Bring it back” is available for 20 seconds. Then we drop the saved text from the app’s memory. Beginning again also clears it. JavaScript cannot guarantee secure memory wiping.</p>
      <p>Closing or refreshing this page loses your words. Your browser may warn you first, but that warning is not available everywhere.</p>
      <p className="privacy-note">Whisp is a symbolic ritual, not treatment or a promise of relief. Take from it only what feels right for you.</p>
      <button className="quiet-button" onClick={close}>Back to my space <Icon name="arrow" size={16} /></button>
    </div>
  </dialog>
}
