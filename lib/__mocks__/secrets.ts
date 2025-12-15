import { vi } from "vitest";

export const getOpenAIKeyForUser = vi.fn().mockResolvedValue("mock-openai-key");
export const getElevenLabsKeyForUser = vi
  .fn()
  .mockResolvedValue("mock-elevenlabs-key");
export const storeSecretsForUser = vi.fn().mockResolvedValue(undefined);
export const getUserSecretStatus = vi.fn().mockResolvedValue({
  hasOpenAIKey: true,
  hasElevenLabsKey: true,
});
export const deleteSecretForUser = vi.fn().mockResolvedValue(undefined);
