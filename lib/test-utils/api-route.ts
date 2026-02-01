/**
 * Test utilities for Next.js API route handlers
 *
 * Provides helpers for:
 * - Creating mock Request objects
 * - Mocking next/headers (cookies, headers)
 * - Parsing route handler responses
 */

import { vi } from "vitest";

/**
 * Create a mock Request object for testing route handlers
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "GET", body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Headers).set("Content-Type", "application/json");
  }

  return new Request(url, requestInit);
}

/**
 * Create a mock GET request
 */
export function createGetRequest(path: string, searchParams?: Record<string, string>): Request {
  const url = new URL(path, "http://localhost:3000");
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return createMockRequest(url.toString(), { method: "GET" });
}

/**
 * Create a mock POST request with JSON body
 */
export function createPostRequest(path: string, body: unknown): Request {
  return createMockRequest(`http://localhost:3000${path}`, {
    method: "POST",
    body,
  });
}

/**
 * Create a mock PATCH request with JSON body
 */
export function createPatchRequest(path: string, body: unknown): Request {
  return createMockRequest(`http://localhost:3000${path}`, {
    method: "PATCH",
    body,
  });
}

/**
 * Create a mock DELETE request
 */
export function createDeleteRequest(path: string): Request {
  return createMockRequest(`http://localhost:3000${path}`, {
    method: "DELETE",
  });
}

/**
 * Parse JSON response from a NextResponse or Response
 */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<{ status: number; data: T }> {
  const data = await response.json();
  return {
    status: response.status,
    data: data as T,
  };
}

/**
 * Create mock route params (for dynamic routes like /api/tracks/[id])
 */
export function createRouteParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return {
    params: Promise.resolve(params),
  };
}

/**
 * Mock cookie store for testing
 */
export function createMockCookieStore() {
  const cookies = new Map<string, string>();

  return {
    get: vi.fn((name: string) => {
      const value = cookies.get(name);
      return value ? { name, value } : undefined;
    }),
    getAll: vi.fn(() => Array.from(cookies.entries()).map(([name, value]) => ({ name, value }))),
    set: vi.fn((name: string, value: string) => {
      cookies.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      cookies.delete(name);
    }),
    has: vi.fn((name: string) => cookies.has(name)),
    _set: (name: string, value: string) => cookies.set(name, value),
    _clear: () => cookies.clear(),
  };
}

/**
 * Mock headers store for testing
 */
export function createMockHeadersStore() {
  const headers = new Map<string, string>();

  return {
    get: vi.fn((name: string) => headers.get(name) ?? null),
    has: vi.fn((name: string) => headers.has(name)),
    entries: vi.fn(() => headers.entries()),
    keys: vi.fn(() => headers.keys()),
    values: vi.fn(() => headers.values()),
    forEach: vi.fn((callback: (value: string, key: string) => void) =>
      headers.forEach((value, key) => callback(value, key))
    ),
    _set: (name: string, value: string) => headers.set(name, value),
    _clear: () => headers.clear(),
  };
}

/**
 * Type for mock cookie store
 */
export type MockCookieStore = ReturnType<typeof createMockCookieStore>;

/**
 * Type for mock headers store
 */
export type MockHeadersStore = ReturnType<typeof createMockHeadersStore>;
