/**
 * Admin utilities for checking admin access.
 * Admin users are defined via ADMIN_EMAILS environment variable.
 */

const ADMIN_EMAILS_ENV = "ADMIN_EMAILS";

/**
 * Get the list of admin emails from environment variable.
 * Expected format: comma-separated list of emails
 * Example: "admin@example.com,other@example.com"
 */
export function getAdminEmails(): string[] {
  const envValue = process.env[ADMIN_EMAILS_ENV];
  if (!envValue || envValue.trim() === "") {
    return [];
  }
  return envValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email address belongs to an admin user.
 * Comparison is case-insensitive.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
