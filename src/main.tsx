import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PostHogProvider } from './components/PostHogProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PostHogProvider>
          <App />
        </PostHogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
