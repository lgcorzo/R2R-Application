// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // Environment detection
  environment: process.env.NODE_ENV || process.env.VERCEL_ENV || 'development',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Attach stack traces to all messages
  attachStacktrace: true,

  // Send default PII
  sendDefaultPii: true,

  // Filter out sensitive data before sending
  beforeSend(event, hint) {
    // Don't send events in development unless explicitly testing
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    // Add additional context
    if (event.contexts) {
      event.contexts.runtime = {
        name: 'node',
        version: process.version,
      };
    }

    // Add tags for better filtering
    event.tags = {
      ...event.tags,
      component: 'server',
      vercel_env: process.env.VERCEL_ENV || 'unknown',
      vercel_region: process.env.VERCEL_REGION || 'unknown',
    };

    // Add release information
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      event.release = process.env.VERCEL_GIT_COMMIT_SHA;
    }

    return event;
  },

  // Note: captureUnhandledRejections is enabled by default in Sentry

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug:
    process.env.NODE_ENV === 'development' &&
    process.env.SENTRY_DEBUG === 'true',
});
