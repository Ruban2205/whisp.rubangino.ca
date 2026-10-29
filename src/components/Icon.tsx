export function Icon({ name, size = 20 }: { name: 'wind' | 'sound' | 'mute' | 'arrow' | 'close' | 'lock' | 'mic' | 'back' | 'spark' | 'help'; size?: number }) {
  const paths = {
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 8.5a2.5 2.5 0 1 1 4 2c-1.2.7-1.5 1.2-1.5 2.5m0 3h.01" /></>,
    wind: <><path d="M3 8h11a3 3 0 1 0-3-3M2 12h17a3 3 0 1 0-2-5M5 16h9a3 3 0 1 1-3 3" /></>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16" /></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5V4ZM16 9l5 6m0-6-5 6" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    spark: <path d="M12 2c0 7-3 10-10 10 7 0 10 3 10 10 0-7 3-10 10-10-7 0-10-3-10-10Z" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
