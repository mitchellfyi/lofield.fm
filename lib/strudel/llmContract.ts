/**
 * LLM contract validation for Strudel code generation
 * Ensures we always get runnable Strudel code from the AI
 */

export interface ValidationError {
  type: 'no_code_block' | 'multiple_code_blocks' | 'missing_tempo' | 'missing_playback';
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
 * Validate that code contains a tempo directive
 * Must have setcps(...) OR .cpm(...)
 */
function hasTempo(code: string): boolean {
  return /setcps\s*\([^)]+\)/.test(code) || /\.cpm\s*\([^)]+\)/.test(code);
}

/**
 * Validate that code contains playback start
 * Must have .play( or .play() or recognised Strudel start pattern
 */
function hasPlayback(code: string): boolean {
  return /\.play\s*\(/.test(code);
}

/**
 * Validate a Strudel code response
 */
export function validateStrudelCode(text: string): ValidationResult {
  const errors: ValidationError[] = [];
  const parsed = parseResponse(text);
  
  // Check for code blocks
  if (parsed.codeBlocks.length === 0) {
    errors.push({
      type: 'no_code_block',
      message: 'Response must contain exactly one fenced code block with Strudel code'
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
  
  // Check for tempo directive
  if (!hasTempo(code)) {
    errors.push({
      type: 'missing_tempo',
      message: 'Code must include a tempo directive: setcps(...) or .cpm(...)'
    });
  }
  
  // Check for playback start
  if (!hasPlayback(code)) {
    errors.push({
      type: 'missing_playback',
      message: 'Code must call .play() to start playback'
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
- The code MUST include setcps(...) or .cpm(...) for tempo
- The code MUST call .play() to start playback
- Output the COMPLETE program, not a diff or partial code

Generate the full response now.`;
}

/**
 * Extract the latest code from a message if it's an assistant message
 */
export function extractLatestCode(messageContent: string): string | null {
  const validation = validateStrudelCode(messageContent);
  return validation.code || null;
}
