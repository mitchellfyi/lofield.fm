import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(process.cwd(), 'prompts');

/**
 * Load a prompt from a markdown file
 * @param filename - Name of the markdown file (e.g., 'system-prompt.md')
 * @returns The prompt content as a string
 */
export function loadPrompt(filename: string): string {
  const filePath = join(PROMPTS_DIR, filename);
  return readFileSync(filePath, 'utf-8').trim();
}

/**
 * Load the system prompt
 */
export function loadSystemPrompt(): string {
  return loadPrompt('system-prompt.md');
}

/**
 * Load the retry prompt template
 */
export function loadRetryPromptTemplate(): string {
  return loadPrompt('retry-prompt.md');
}

/**
 * Build a retry prompt with validation errors
 * @param errors - Array of validation error messages
 * @returns The formatted retry prompt
 */
export function buildRetryPrompt(errors: string[]): string {
  const template = loadRetryPromptTemplate();
  const errorMessages = errors.map(e => `- ${e}`).join('\n');
  return template.replace('{{ERRORS}}', errorMessages);
}
