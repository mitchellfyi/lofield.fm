/**
 * LLM contract validation for Tone.js code generation
 * Ensures we always get runnable Tone.js code from the AI
 */

export interface ValidationError {
  type: "no_code_block" | "multiple_code_blocks" | "missing_tone" | "syntax_error";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  code?: string;
  errors: ValidationError[];
}

export interface ParsedResponse {
  notes?: string;
  codeBlocks: string[];
}

/**
 * Extract all fenced code blocks from response text
 */
export function extractCodeBlocks(text: string): string[] {
  const codeBlockRegex = /```(?:js|javascript)?\s*([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }

  return blocks;
}

/**
 * Parse response into notes and code blocks
 */
export function parseResponse(text: string): ParsedResponse {
  // Extract notes section if present
  const notesMatch = text.match(/Notes?:\s*([\s\S]*?)(?=Code:|```|$)/i);
  const notes = notesMatch ? notesMatch[1].trim() : undefined;

  // Extract all code blocks
  const codeBlocks = extractCodeBlocks(text);

  return { notes, codeBlocks };
}

/**
 * Validate that code uses Tone.js
 * Must reference Tone.*
 */
function hasToneUsage(code: string): boolean {
  return /Tone\./.test(code);
}

/**
 * Validate that code is syntactically valid JavaScript
 * Uses Function constructor to parse without executing
 *
 * @param code - JavaScript code to validate
 * @returns Object with valid boolean and optional error message
 */
export function validateJavaScriptSyntax(code: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Use Function constructor to parse the code without executing it
    // This catches syntax errors like missing brackets, invalid tokens, etc.
    new Function(code);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: message };
  }
}

/**
 * Validate raw Tone.js code (without code block markers)
 * Used when validating code directly from the editor
 *
 * Note: Transport.start() is called automatically by the runtime
 */
export function validateRawToneCode(code: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for JavaScript syntax errors first
  const syntaxCheck = validateJavaScriptSyntax(code);
  if (!syntaxCheck.valid) {
    errors.push({
      type: "syntax_error",
      message: `JavaScript syntax error: ${syntaxCheck.error}`,
    });
    // Return early on syntax errors - other validations won't be meaningful
    return { valid: false, code, errors };
  }

  // Check for Tone.js usage
  if (!hasToneUsage(code)) {
    errors.push({
      type: "missing_tone",
      message: "Code must use Tone.js API (e.g., Tone.Sequence, Tone.Transport, etc.)",
    });
  }

  if (errors.length > 0) {
    return { valid: false, code, errors };
  }

  return { valid: true, code, errors: [] };
}

/**
 * Validate a Tone.js code response (from LLM, expects code blocks)
 *
 * Note: Transport.start() is called automatically by the runtime
 */
export function validateToneCode(text: string): ValidationResult {
  const errors: ValidationError[] = [];
  const parsed = parseResponse(text);

  // Check for code blocks
  if (parsed.codeBlocks.length === 0) {
    errors.push({
      type: "no_code_block",
      message: "Response must contain exactly one fenced code block with Tone.js code",
    });
    return { valid: false, errors };
  }

  if (parsed.codeBlocks.length > 1) {
    errors.push({
      type: "multiple_code_blocks",
      message: "Response must contain exactly ONE fenced code block, not multiple",
    });
    return { valid: false, errors };
  }

  const code = parsed.codeBlocks[0];

  // Check for JavaScript syntax errors
  const syntaxCheck = validateJavaScriptSyntax(code);
  if (!syntaxCheck.valid) {
    errors.push({
      type: "syntax_error",
      message: `JavaScript syntax error: ${syntaxCheck.error}`,
    });
    // Return early on syntax errors - other validations won't be meaningful
    return { valid: false, code, errors };
  }

  // Check for Tone.js usage
  if (!hasToneUsage(code)) {
    errors.push({
      type: "missing_tone",
      message: "Code must use Tone.js API (e.g., Tone.Sequence, Tone.Transport, etc.)",
    });
  }

  if (errors.length > 0) {
    return { valid: false, code, errors };
  }

  return { valid: true, code, errors: [] };
}

/**
 * Build a retry prompt for validation failures
 * @deprecated Use buildRetryPrompt from @/lib/prompts/loader instead (server-side only)
 *
 * This client-safe version is kept for backward compatibility but should not be used
 * in new code. The server-side version in @/lib/prompts/loader loads from markdown files.
 */
export function buildRetryPrompt(validationErrors: ValidationError[]): string {
  // Client-safe inline version (matches the template in prompts/retry-prompt.md)
  const errorMessages = validationErrors.map((e) => `- ${e.message}`).join("\n");

  return `Your previous response had validation errors:
${errorMessages}

Please provide the response again following the exact format specified:
- A "Notes:" section (max 3 bullets)
- "Code:" followed by EXACTLY ONE fenced code block
- The code MUST use Tone.js API (Tone.Sequence, Tone.Transport, etc.)
- Create synths OUTSIDE of sequences (not inside callbacks)
- Do NOT include window.__toneCleanup or Tone.Transport.start() - these are handled automatically
- Output the COMPLETE program, not a diff or partial code

Generate the full response now.`;
}

/**
 * Extract the latest code from a message if it's an assistant message
 */
export function extractLatestCode(messageContent: string): string | null {
  const validation = validateToneCode(messageContent);
  return validation.code || null;
}

/**
 * Extract code from streaming text (handles incomplete code blocks)
 * Returns the code content even if the closing ``` hasn't arrived yet
 */
export function extractStreamingCode(text: string): {
  code: string | null;
  isComplete: boolean;
} {
  // First try to extract a complete code block
  const completeBlocks = extractCodeBlocks(text);
  if (completeBlocks.length > 0) {
    return { code: completeBlocks[0], isComplete: true };
  }

  // Look for an incomplete code block (has opening ``` but no closing ```)
  const incompleteMatch = text.match(/```(?:js|javascript)?\s*([\s\S]*)$/);
  if (incompleteMatch && incompleteMatch[1]) {
    // Make sure this isn't just an empty code block starting
    const partialCode = incompleteMatch[1].trim();
    if (partialCode.length > 0) {
      return { code: partialCode, isComplete: false };
    }
  }

  return { code: null, isComplete: false };
}
