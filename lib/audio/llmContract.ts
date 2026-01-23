/**
 * LLM contract validation for Tone.js code generation
 * Ensures we always get runnable Tone.js code from the AI
 */

export interface ValidationError {
  type: 'no_code_block' | 'multiple_code_blocks' | 'missing_tone' | 'missing_transport';
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
 * Validate that code starts Transport
 * Must have Transport.start()
 */
function hasTransportStart(code: string): boolean {
  return /Transport\.start\s*\(/.test(code) || /Tone\.Transport\.start\s*\(/.test(code);
}

/**
 * Validate raw Tone.js code (without code block markers)
 * Used when validating code directly from the editor
 */
export function validateRawToneCode(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Check for Tone.js usage
  if (!hasToneUsage(code)) {
    errors.push({
      type: 'missing_tone',
      message: 'Code must use Tone.js API (e.g., Tone.Sequence, Tone.Transport, etc.)'
    });
  }
  
  // Check for Transport start
  if (!hasTransportStart(code)) {
    errors.push({
      type: 'missing_transport',
      message: 'Code must call Tone.Transport.start() to begin playback'
    });
  }
  
  if (errors.length > 0) {
    return { valid: false, code, errors };
  }
  
  return { valid: true, code, errors: [] };
}

/**
 * Validate a Tone.js code response (from LLM, expects code blocks)
 */
export function validateToneCode(text: string): ValidationResult {
  const errors: ValidationError[] = [];
  const parsed = parseResponse(text);
  
  // Check for code blocks
  if (parsed.codeBlocks.length === 0) {
    errors.push({
      type: 'no_code_block',
      message: 'Response must contain exactly one fenced code block with Tone.js code'
    });
    return { valid: false, errors };
  }
  
  if (parsed.codeBlocks.length > 1) {
    errors.push({
      type: 'multiple_code_blocks',
      message: 'Response must contain exactly ONE fenced code block, not multiple'
    });
    return { valid: false, errors };
  }
  
  const code = parsed.codeBlocks[0];
  
  // Check for Tone.js usage
  if (!hasToneUsage(code)) {
    errors.push({
      type: 'missing_tone',
      message: 'Code must use Tone.js API (e.g., Tone.Sequence, Tone.Transport, etc.)'
    });
  }
  
  // Check for Transport start
  if (!hasTransportStart(code)) {
    errors.push({
      type: 'missing_transport',
      message: 'Code must call Tone.Transport.start() to begin playback'
    });
  }
  
  if (errors.length > 0) {
    return { valid: false, code, errors };
  }
  
  return { valid: true, code, errors: [] };
}

/**
 * Build a retry prompt for validation failures
 */
export function buildRetryPrompt(validationErrors: ValidationError[]): string {
  const errorMessages = validationErrors.map(e => `- ${e.message}`).join('\n');
  
  return `Your previous response had validation errors:
${errorMessages}

Please provide the response again following the exact format specified:
- A "Notes:" section (max 3 bullets)
- "Code:" followed by EXACTLY ONE fenced code block
- The code MUST use Tone.js API (Tone.Sequence, Tone.Transport, etc.)
- The code MUST call Tone.Transport.start() at the end
- Create synths OUTSIDE of sequences (not inside callbacks)
- Include window.__toneCleanup function to dispose instruments
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
