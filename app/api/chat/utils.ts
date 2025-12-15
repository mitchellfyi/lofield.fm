export type ChatRole = "user" | "assistant" | "system";

export function getMessageContent(message: any): unknown {
  if (message.content !== undefined && message.content !== null) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts;
  }
  return "";
}

export function normalizeContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const maybeText =
            (part as { text?: unknown }).text ??
            (part as { value?: unknown }).value ??
            (part as { content?: unknown }).content;
          if (typeof maybeText === "string") return maybeText;
        }
        try {
          return JSON.stringify(part);
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("");
    // Return the concatenated text even if empty to allow callers to detect empties
    return text;
  }
  try {
    return JSON.stringify(content);
  } catch {
    return "";
  }
}

export function hasAnyContent(messages: Array<{ role: ChatRole; content: unknown }>): boolean {
  return messages.some((m) => normalizeContent(m.content).trim().length > 0);
}

export function firstEmptyMessageIndex(
  messages: Array<{ role: ChatRole; content: unknown }>
): number | null {
  for (let i = 0; i < messages.length; i++) {
    const normalized = normalizeContent(messages[i].content);
    if (normalized.trim().length === 0) {
      return i;
    }
  }
  return null;
}

