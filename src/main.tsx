import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/caveat/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import { SiteRoot } from './SiteRoot'
import './styles.css'

const root = document.getElementById('root')!
const app = <React.StrictMode><SiteRoot /></React.StrictMode>
const options = { onCaughtError: () => {}, onUncaughtError: () => window.dispatchEvent(new Event('whisp:root-error')) }
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app, options)
else ReactDOM.createRoot(root, options).render(app)
