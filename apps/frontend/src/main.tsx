import * as Sentry from '@sentry/react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App.tsx'
import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE || 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  release: import.meta.env.VITE_APP_VERSION || '2.0.0',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
