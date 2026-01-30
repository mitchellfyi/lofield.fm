/**
 * Types for user profiles
 */

/**
 * Public profile data (safe to share)
 */
export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/**
 * Profile with additional stats
 */
export interface ProfileWithStats extends PublicProfile {
  track_count: number;
  total_plays: number;
}

/**
 * Profile update payload
 */
export interface ProfileUpdate {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Reserved usernames that cannot be used
 */
export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "app",
  "auth",
  "explore",
  "settings",
  "studio",
  "user",
  "users",
  "help",
  "support",
  "about",
  "contact",
  "privacy",
  "terms",
  "legal",
  "blog",
  "docs",
  "home",
  "profile",
  "dashboard",
  "account",
  "login",
  "logout",
  "signin",
  "signout",
  "signup",
  "register",
  "lofield",
];

/**
 * Validate username format
 * - 3-30 characters
 * - Lowercase alphanumeric and underscores only
 * - Cannot start or end with underscore
 * - Cannot have consecutive underscores
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }

  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Username must be at most 30 characters" };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }

  if (trimmed.startsWith("_") || trimmed.endsWith("_")) {
    return { valid: false, error: "Username cannot start or end with underscore" };
  }

  if (trimmed.includes("__")) {
    return { valid: false, error: "Username cannot have consecutive underscores" };
  }

  if (RESERVED_USERNAMES.includes(trimmed)) {
    return { valid: false, error: "This username is reserved" };
  }

  return { valid: true };
}

/**
 * Validate bio length
 */
export function validateBio(bio: string): { valid: boolean; error?: string } {
  if (bio.length > 500) {
    return { valid: false, error: "Bio must be at most 500 characters" };
  }
  return { valid: true };
}

/**
 * Get Gravatar URL for email
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  // Simple hash function for browser (not crypto secure, but fine for gravatar)
  const hash = email
    .trim()
    .toLowerCase()
    .split("")
    .reduce((acc, char) => {
      const chr = char.charCodeAt(0);
      acc = (acc << 5) - acc + chr;
      return acc & acc;
    }, 0)
    .toString(16);

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
