import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only enable Sentry when DSN is configured
  enabled: !!process.env.SENTRY_DSN,

  // Performance Monitoring - sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Don't send errors in development unless explicitly enabled
  beforeSend(event) {
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG_DEV) {
      return null;
    }
    return event;
  },
});
