/**
 * Tutorial step definitions for the onboarding flow
 * Each step highlights a UI element and provides guidance
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the element to highlight (optional) */
  targetSelector?: string;
  /** Position of the tooltip relative to target */
  position: "top" | "bottom" | "left" | "right" | "center";
  /** Action to perform after this step (e.g., trigger a UI change) */
  action?: "show-chat" | "show-code" | "show-controls";
  /** Whether this step requires user interaction to proceed */
  waitForInteraction?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to LoField Music Lab!",
    description:
      "Create music using AI and code. This quick tour will show you how to get started. Press Next to continue.",
    position: "center",
  },
  {
    id: "chat",
    title: "Chat with AI",
    description:
      "Describe the music you want to create. Try something like 'make a chill lo-fi beat with jazzy chords' and the AI will generate the code.",
    targetSelector: '[data-tutorial="chat-input"]',
    position: "top",
    action: "show-chat",
  },
  {
    id: "code",
    title: "Live Code Editor",
    description:
      "The AI generates Tone.js code that you can edit directly. Changes apply in real-time when Live mode is enabled.",
    targetSelector: '[data-tutorial="code-panel"]',
    position: "left",
    action: "show-code",
  },
  {
    id: "play",
    title: "Play Your Music",
    description:
      "Hit Play to hear your creation. The music loops automatically so you can tweak it as it plays.",
    targetSelector: '[data-tutorial="play-button"]',
    position: "top",
  },
  {
    id: "tweaks",
    title: "Live Controls",
    description:
      "Adjust BPM, reverb, delay and more in real-time. These controls let you shape your sound without touching code.",
    targetSelector: '[data-tutorial="tweaks-panel"]',
    position: "right",
    action: "show-controls",
  },
  {
    id: "presets",
    title: "Start with Presets",
    description:
      "Not sure where to start? Load a preset from the menu to explore different styles and learn from the code.",
    targetSelector: '[data-tutorial="preset-button"]',
    position: "bottom",
  },
  {
    id: "complete",
    title: "You're Ready!",
    description:
      "That's the basics! Try chatting with the AI to create your first track. You can restart this tutorial anytime from the help menu.",
    position: "center",
  },
];

/**
 * LocalStorage key for tutorial completion state
 */
export const TUTORIAL_STORAGE_KEY = "lofield_tutorial_completed";

/**
 * Check if the tutorial has been completed
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
}

/**
 * Mark the tutorial as completed
 */
export function markTutorialCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
}

/**
 * Reset tutorial state to show it again
 */
export function resetTutorial(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}
