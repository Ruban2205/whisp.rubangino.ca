import { renderToString } from 'react-dom/server'
import App from './App'

// Build-time rendering uses only the empty initial landing state, never a browser session.
export function renderLanding() { return renderToString(<App />) }
