// Default limits - can be overridden via environment variables
export const DEFAULT_DAILY_TOKEN_LIMIT = 100000;
export const DEFAULT_REQUESTS_PER_MINUTE = 20;
export const DEFAULT_MAX_TOKENS_PER_REQUEST = 4000;

// Environment variable names for configuration
export const ENV_DAILY_TOKEN_LIMIT = "DAILY_TOKEN_LIMIT";
export const ENV_REQUESTS_PER_MINUTE = "REQUESTS_PER_MINUTE";
export const ENV_MAX_TOKENS_PER_REQUEST = "MAX_TOKENS_PER_REQUEST";

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

// Quota result
export interface QuotaResult {
  allowed: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  dailyLimit: number;
  periodStart: Date;
}

// User quota configuration
export interface UserQuota {
  userId: string;
  dailyTokenLimit: number;
  requestsPerMinute: number;
  tier: string;
  tokensUsed: number;
  requestsCount: number;
  periodStart: Date;
}

// Abuse status
export interface AbuseStatus {
  flagged: boolean;
  flags: AbuseFlag[];
}

// Individual abuse flag
export interface AbuseFlag {
  id: string;
  userId: string;
  violationType: string;
  count: number;
  lastFlaggedAt: Date;
  createdAt: Date;
}

// Abuse violation types
export type ViolationType =
  | "quota_exceeded"
  | "rate_limit_exceeded"
  | "suspicious_pattern"
  | "rapid_retry";

// Usage statistics for display
export interface UsageStats {
  tokensUsed: number;
  tokensRemaining: number;
  dailyLimit: number;
  requestsThisMinute: number;
  requestsPerMinuteLimit: number;
  periodStart: Date;
  tier: string;
}

// Rate limit headers for response
export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
  "X-Quota-Used": string;
  "X-Quota-Remaining": string;
}
