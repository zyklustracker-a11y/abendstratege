import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { splashFortschritt } from './lib/splash'
import './styles.css'

// Das Bundle ist da – der erste Meilenstein, den der Ladebildschirm kennt.
splashFortschritt(45)

const container = document.getElementById('root')
if (!container) throw new Error('#root nicht gefunden')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
