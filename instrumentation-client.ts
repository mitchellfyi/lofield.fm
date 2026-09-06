import * as Sentry from "@sentry/nextjs";
import { scrubErrorEvent } from "./lib/ops-error-tracking";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  sendDefaultPii: false,
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "BrowserSession"),
  sendClientReports: false,
  tracesSampleRate: 0,
  beforeSend: scrubErrorEvent,
  initialScope: {
    tags: {
      ops_project_id: process.env.NEXT_PUBLIC_OPS_PROJECT_ID,
      runtime: "browser",
      hostname: typeof window === "undefined" ? undefined : window.location.hostname,
    },
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
