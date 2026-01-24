import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable Sentry when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay sampling - capture 1% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // Enable Session Replay for debugging production issues
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Don't send errors in development unless explicitly enabled
  beforeSend(event) {
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG_DEV) {
      return null;
    }
    return event;
  },

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /ResizeObserver loop/,
    // Network errors
    /Network request failed/,
    /Load failed/,
    // Audio context errors that are handled gracefully
    /AudioContext was not allowed to start/,
  ],
});
