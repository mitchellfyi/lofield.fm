import { DEFAULT_MAX_TOKENS_PER_REQUEST, ENV_MAX_TOKENS_PER_REQUEST } from "./types";

// Approximate characters per token (OpenAI average)
const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a text string.
 * Uses the ~4 characters per token approximation.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate total tokens for a request including messages and system prompt.
 */
export function estimateRequestTokens(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): number {
  let total = 0;

  // Add system prompt tokens
  if (systemPrompt) {
    total += estimateTokens(systemPrompt);
  }

  // Add message tokens
  for (const msg of messages) {
    if (msg.content) {
      total += estimateTokens(msg.content);
    }
    // Add overhead for role and message structure (~4 tokens per message)
    total += 4;
  }

  return total;
}

/**
 * Get the maximum tokens allowed per request.
 */
export function getMaxTokensPerRequest(): number {
  const envValue = process.env[ENV_MAX_TOKENS_PER_REQUEST];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_MAX_TOKENS_PER_REQUEST;
}

/**
 * Check if a request exceeds the token limit.
 */
export function isRequestWithinTokenLimit(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): { valid: boolean; tokens: number; limit: number } {
  const tokens = estimateRequestTokens(messages, systemPrompt);
  const limit = getMaxTokensPerRequest();
  return {
    valid: tokens <= limit,
    tokens,
    limit,
  };
}
