import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT || 'development',
  enabled: process.env.SENTRY_ENABLED !== 'false',
  integrations: [
    nodeProfilingIntegration(),
    new Sentry.Integrations.OnUncaughtExceptionIntegration(),
    new Sentry.Integrations.OnUnhandledRejectionIntegration(),
  ],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  attachStacktrace: true,
  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Event (dev mode):', event.message);
      return null;
    }
    return event;
  },
});
