import * as Sentry from "@sentry/nextjs";
import { scrubErrorEvent } from "./lib/ops-error-tracking";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production" && Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.SOURCE_COMMIT,
  sendDefaultPii: false,
  sendClientReports: false,
  tracesSampleRate: 0,
  beforeSend: scrubErrorEvent,
  initialScope: { tags: { ops_project_id: process.env.OPS_PROJECT_ID, runtime: "server" } },
});
