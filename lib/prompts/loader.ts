import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getModelById } from "@/lib/models";

const PROMPTS_DIR = join(process.cwd(), "prompts");

/**
 * Load a prompt from a markdown file
 * @param filename - Name of the markdown file (e.g., 'system-prompt.md')
 * @returns The prompt content as a string
 */
export function loadPrompt(filename: string): string {
  const filePath = join(PROMPTS_DIR, filename);
  return readFileSync(filePath, "utf-8").trim();
}

/**
 * Load the system prompt with optional variation
 * @param variation - Optional variation name (e.g., 'concise' loads 'system-prompt-concise.md')
 * @returns The prompt content as a string
 */
export function loadSystemPrompt(variation?: string): string {
  if (variation) {
    const variationFilename = `system-prompt-${variation}.md`;
    const variationPath = join(PROMPTS_DIR, variationFilename);
    if (existsSync(variationPath)) {
      return loadPrompt(variationFilename);
    }
    // Fall back to default if variation file doesn't exist
  }
  return loadPrompt("system-prompt.md");
}

/**
 * Load the system prompt for a specific model
 * @param modelId - The model ID (e.g., 'gpt-4o-mini')
 * @returns The appropriate system prompt for the model
 */
export function loadSystemPromptForModel(modelId: string): string {
  const model = getModelById(modelId);
  return loadSystemPrompt(model?.systemPromptVariation);
}

/**
 * Load the retry prompt template
 */
export function loadRetryPromptTemplate(): string {
  return loadPrompt("retry-prompt.md");
}

/**
 * Build a retry prompt with validation errors
 * @param errors - Array of validation error messages
 * @returns The formatted retry prompt
 */
export function buildRetryPrompt(errors: string[]): string {
  const template = loadRetryPromptTemplate();
  const errorMessages = errors.map((e) => `- ${e}`).join("\n");
  return template.replace("{{ERRORS}}", errorMessages);
}
