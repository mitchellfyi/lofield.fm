---
applyTo: "app/api/**/*,lib/**/*"
---

# Provider + usage tracking instructions

- All OpenAI/ElevenLabs calls happen server-side using per-user keys from Vault.
- Do not return keys to the client. Ever.
- Every provider call should emit a `usage_events` record with attribution (chat_id, track_id, action_type, model).
- Sanitise logged errors: no headers, no tokens, no prompts in raw logs.
- Prefer one "action_group_id" per user click to correlate refine + generate sequences.
