// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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

  // Filter out sensitive data before sending
  beforeSend(event) {
    // Don't send events in development unless explicitly testing
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    // Add tags for better filtering
    event.tags = {
      ...event.tags,
      component: 'edge',
      vercel_env: process.env.VERCEL_ENV || 'unknown',
    };

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug:
    process.env.NODE_ENV === 'development' &&
    process.env.SENTRY_DEBUG === 'true',
});
