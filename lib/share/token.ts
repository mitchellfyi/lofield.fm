/**
 * Token generation and validation for share links
 */

// Alphanumeric alphabet for URL-safe tokens (no ambiguous chars like 0/O, 1/l)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const TOKEN_LENGTH = 12;

// Regex for validating tokens (matches any 12-char alphanumeric string)
const TOKEN_REGEX = /^[A-Za-z0-9]{12}$/;

/**
 * Generate a cryptographically secure share token
 * @returns A 12-character alphanumeric token
 */
export function generateShareToken(): string {
  const randomValues = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(randomValues);

  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += ALPHABET[randomValues[i] % ALPHABET.length];
  }

  return token;
}

/**
 * Validate a share token format
 * @param token The token to validate
 * @returns True if the token is a valid format
 */
export function isValidShareToken(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

/**
 * Build the full share URL for a token
 * @param token The share token
 * @param baseUrl Optional base URL (defaults to current origin or localhost)
 * @returns The full share URL
 */
export function buildShareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/share/${token}`;
}
