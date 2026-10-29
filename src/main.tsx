import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/caveat/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import App from './App'
import './styles.css'

const root = document.getElementById('root')!
const app = <React.StrictMode><App /></React.StrictMode>
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)
