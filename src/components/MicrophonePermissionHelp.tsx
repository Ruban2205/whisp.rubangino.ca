import { useEffect, useRef, useState } from 'react'
import { microphoneHelpDevice, type MicrophoneHelpDevice } from '../lib/microphonePermission'
import { Icon } from './Icon'

export function MicrophonePermissionHelp({ retry, continueWithout }: { retry: () => void; continueWithout: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const returnToWriting = useRef(false)
  const continueQuietly = () => { returnToWriting.current = true; continueWithout() }
  const [device, setDevice] = useState<MicrophoneHelpDevice>(() => microphoneHelpDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints))
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    return () => {
      element?.close()
      if (returnToWriting.current) document.querySelector<HTMLElement>('textarea:not([readonly]), .skip-button, .enter-button:not([disabled])')?.focus({ preventScroll: true })
      else if (previous?.isConnected && !(previous instanceof HTMLButtonElement && previous.disabled)) previous.focus({ preventScroll: true })
      else document.querySelector<HTMLElement>('textarea:not([readonly]), .skip-button, .enter-button:not([disabled])')?.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="privacy-dialog microphone-permission-dialog" aria-labelledby="microphone-permission-title" aria-describedby="microphone-permission-summary" onCancel={event => { event.preventDefault(); continueQuietly() }} onClick={event => { if (event.target === event.currentTarget) continueQuietly() }}>
    <div className="privacy-inner">
      <button className="icon-button privacy-close" aria-label="Close microphone help" onClick={continueQuietly}><Icon name="close" /></button>
      <Icon name="mic" size={27} />
      <p className="eyebrow">A LITTLE HELP GETTING CONNECTED</p>
      <h2 id="microphone-permission-title">Microphone access is off.</h2>
      <p id="microphone-permission-summary">Your browser or device didn’t allow microphone access. You can turn it on in settings, or keep writing without it.</p>
      <label className="permission-device">Instructions for<select value={device} aria-label="Microphone help device" onChange={event => setDevice(event.target.value as MicrophoneHelpDevice)}>
        <option value="ios">iPhone or iPad</option><option value="android">Android</option><option value="computer">Computer</option>
      </select></label>
      <ol className="permission-steps">
        {device === 'ios' ? <>
          <li>In your browser, open this site’s page menu or website settings. If Microphone is listed, choose Ask or Allow.</li>
          <li>For Safari, check Settings → Apps → Safari → Microphone and choose Ask or Allow. Other browsers: Privacy &amp; Security → Microphone, then enable your browser if listed.</li>
          <li>Return to this page and choose Try again. If you’re inside another app’s browser, open Whisp in Safari or your usual browser.</li>
        </> : device === 'android' ? <>
          <li>In Chrome, open Menu → Settings → Site settings → Microphone. Allow this site if it appears under Blocked. In other browsers, look for Site permissions.</li>
          <li>In Android Settings, open Apps → your browser → Permissions → Microphone and allow access. Check that your phone’s microphone privacy switch is on.</li>
          <li>Return to this page and choose Try again.</li>
        </> : <>
          <li>Open this site’s permissions in your browser and set Microphone to Ask or Allow.</li>
          <li>Check your computer’s microphone privacy settings and allow your browser to use it.</li>
          <li>Return to this page and choose Try again. If a managed browser or embedded page blocks access, use your usual browser or contact the device administrator.</li>
        </>}
      </ol>
      <p className="permission-guide-link"><a href={device === 'ios' ? 'https://support.apple.com/guide/iphone/iph168c4bbd5/ios' : device === 'android' ? 'https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DAndroid' : 'https://support.brave.app/hc/en-us/articles/360018205431-How-do-I-change-site-permissions'} target="_blank" rel="noreferrer noopener">{device === 'ios' ? 'Apple microphone guide' : device === 'android' ? 'Chrome microphone guide' : 'Brave microphone guide'} ↗</a></p>
      <p>Whisp can’t change these settings for you. Settings labels may vary by browser and version.</p>
      <div className="permission-actions"><button className="quiet-button" onClick={retry}>Try again <Icon name="arrow" size={16} /></button><button className="text-button" onClick={continueQuietly}>Keep writing without microphone</button></div>
      <p className="privacy-note">Your words are still on this page. Refreshing or closing it loses your writing. Audio is only processed on your device.</p>
    </div>
  </dialog>
}
