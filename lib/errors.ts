/**
 * Centralized error handling utilities
 *
 * Provides consistent error messages and handling across the application.
 */

/**
 * Get a user-friendly error message based on HTTP status code
 */
export function getHttpErrorMessage(status: number, context: string = "data"): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return `Please sign in to access your ${context}.`;
    case 403:
      return `You don't have permission to access this ${context}.`;
    case 404:
      return `Could not find your ${context}.`;
    case 409:
      return "This operation conflicts with existing data.";
    case 422:
      return "The provided data is invalid.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Server error. Please try again later.";
    default:
      if (status >= 400 && status < 500) {
        return "There was a problem with your request.";
      }
      if (status >= 500) {
        return "Server error. Please try again later.";
      }
      return `Unable to load ${context}. Please try again.`;
  }
}

/**
 * Get a user-friendly error message from an error object
 */
export function getFriendlyErrorMessage(
  error: unknown,
  context: string = "data",
  status?: number
): string {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Unable to connect. Check your internet connection.";
  }

  // AbortError (request cancelled)
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Request was cancelled.";
  }

  // HTTP status-based messages
  if (status) {
    return getHttpErrorMessage(status, context);
  }

  // Error with message
  if (error instanceof Error) {
    // Don't expose internal error messages to users
    if (error.message.includes("PGRST") || error.message.includes("supabase")) {
      return `Unable to load ${context}. Please try again.`;
    }
    return error.message;
  }

  // Object with status property
  if (typeof error === "object" && error !== null && "status" in error) {
    const statusCode = (error as { status: number }).status;
    return getHttpErrorMessage(statusCode, context);
  }

  return `Unable to load ${context}. Please try again.`;
}

/**
 * Extract status code from various error shapes
 */
export function extractStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }
  return undefined;
}

/**
 * Type guard for errors with a message property
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Safe error message extraction for catch blocks
 */
export function getErrorMessage(error: unknown, fallback: string = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}
