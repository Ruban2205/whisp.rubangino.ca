import { useState } from 'react'
import type { VoiceWriting } from '../hooks/useVoiceWriting'
import { Icon } from './Icon'
export function VoiceControls({ voice, start, finish }: { voice: VoiceWriting; start: () => void; finish: () => void }) {
  const [explain, setExplain] = useState(false)
  return <div className="voice-writing">
    <button className={`voice-button ${voice.busy ? 'voice-active' : ''}`} aria-expanded={explain || voice.busy} onClick={() => { if (voice.status === 'listening') finish(); else if (!voice.busy) setExplain(!explain) }} disabled={voice.status === 'processing' || voice.status === 'loading' || voice.status === 'requesting'}>
      <Icon name={voice.busy ? 'spark' : 'mic'} size={17} />
      {voice.status === 'listening' ? 'Finish voice typing' : voice.status === 'loading' ? 'Preparing voice typing…' : voice.status === 'processing' ? 'Finishing your words…' : voice.status === 'requesting' ? 'Waiting for permission…' : 'Speak your thoughts'}
    </button>
    {explain && !voice.busy && <div className="voice-explanation" role="region" aria-label="Private voice typing">
      <p>Speak at your own pace. English voice typing runs on your device; your audio is never uploaded. You can edit every word.</p>
      <p>Voice typing loads about 70 MB from this site. Its model cache clears automatically when you let go, so a later session may need another download. Your audio is never saved or uploaded. Unclear speech may not become words.</p>
      <button className="quiet-button" onClick={() => { setExplain(false); start() }}>Enable private voice typing <Icon name="arrow" size={16} /></button>
      <button className="text-button" onClick={() => setExplain(false)}>Not now</button>
    </div>}
    {(voice.message || voice.busy) && <div className="voice-status" role="status" aria-label="Voice typing status">
      {voice.busy && <span className="voice-light" aria-hidden="true" />}{voice.message}
      {voice.status === 'listening' && <span className="voice-level" role="meter" aria-label="Voice input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(voice.level * 100)}><span style={{ transform: `scaleX(${voice.level})` }} /></span>}
    </div>}
    {voice.busy && <button className="text-button voice-cancel" onClick={voice.cancel}>Cancel voice typing</button>}
    {voice.status === 'listening' && <p className="voice-hint">When you’re done, choose Finish voice typing. Then take a slow breath and blow gently near the microphone. Music and breath release pause while you speak.</p>}
  </div>
}
