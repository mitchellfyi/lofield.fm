import * as Sentry from "@sentry/nextjs";

/**
 * Context for error capture
 */
export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** User-friendly error message */
  userMessage?: string;
  /** Additional metadata */
  extra?: Record<string, unknown>;
}

/**
 * Context for audio error capture
 */
export interface AudioErrorContext extends ErrorContext {
  /** Strudel code that caused the error (first 500 chars) */
  code?: string;
  /** Line number where error occurred */
  line?: number;
  /** Audio context state */
  audioContextState?: string;
}

/**
 * Context for LLM error capture
 */
export interface LLMErrorContext extends ErrorContext {
  /** Model being used */
  model?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Number of retry attempts */
  retryCount?: number;
  /** Whether it was a validation error */
  isValidationError?: boolean;
}

/**
 * Event data for logging
 */
export interface EventData {
  /** Category of event */
  category?: string;
  /** Additional properties */
  [key: string]: unknown;
}

/**
 * Capture a general error with context
 */
export function captureError(error: Error, context?: ErrorContext): void {
  if (context) {
    Sentry.setContext("errorContext", {
      component: context.component,
      action: context.action,
      userMessage: context.userMessage,
    });

    if (context.extra) {
      Sentry.setContext("extra", context.extra);
    }
  }

  Sentry.captureException(error);
}

/**
 * Capture an audio/Strudel error with specialized context
 */
export function captureAudioError(error: Error, context?: AudioErrorContext): void {
  const tags: Record<string, string> = {
    errorType: "audio",
  };

  if (context?.audioContextState) {
    tags.audioContextState = context.audioContextState;
  }

  Sentry.withScope((scope) => {
    scope.setTags(tags);

    if (context) {
      scope.setContext("audioError", {
        component: context.component || "audio",
        action: context.action,
        line: context.line,
        // Truncate code to avoid sending too much data
        code: context.code?.slice(0, 500),
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture an LLM/AI error with specialized context
 */
export function captureLLMError(error: Error, context?: LLMErrorContext): void {
  const tags: Record<string, string> = {
    errorType: "llm",
  };

  if (context?.model) {
    tags.model = context.model;
  }

  if (context?.isValidationError) {
    tags.isValidationError = "true";
  }

  Sentry.withScope((scope) => {
    scope.setTags(tags);

    if (context) {
      scope.setContext("llmError", {
        component: context.component || "llm",
        action: context.action,
        model: context.model,
        requestId: context.requestId,
        retryCount: context.retryCount,
        isValidationError: context.isValidationError,
        ...context.extra,
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a custom event (for analytics/monitoring)
 */
export function captureEvent(name: string, data?: EventData): void {
  // Use Sentry breadcrumb for event tracking
  Sentry.addBreadcrumb({
    category: data?.category || "event",
    message: name,
    level: "info",
    data: data,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: category || "navigation",
    message,
    level: "info",
    data,
  });
}
