import type { Event } from "@sentry/nextjs";

export function scrubErrorEvent<T extends Event>(event: T): T & Event {
  delete event.user;
  delete event.extra;
  delete event.breadcrumbs;
  if (event.request) {
    const request: NonNullable<Event["request"]> = { method: event.request.method };
    try {
      const url = new URL(event.request.url || "");
      request.url = url.origin + url.pathname;
      event.tags = { ...event.tags, hostname: url.hostname };
    } catch {
      // A malformed URL must not carry query strings or credentials into a report.
    }
    event.request = request;
  }
  return event;
}
