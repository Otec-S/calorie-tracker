import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Handle PWA updates: reload when a new service worker becomes ready to take over.
registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
})

// Periodically check for service worker updates every hour.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((reg) => {
    setInterval(() => {
      void reg.update()
    }, 60 * 60 * 1000)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
