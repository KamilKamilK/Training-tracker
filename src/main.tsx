import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.js'
import { ServiceWorkerPrompt } from './components/common/ServiceWorkerPrompt.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ServiceWorkerPrompt />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
