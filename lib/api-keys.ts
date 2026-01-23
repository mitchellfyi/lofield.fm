import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET environment variable is required");
  }
  // Ensure the key is exactly 32 bytes for AES-256
  return crypto.scryptSync(secret, "salt", 32);
}

export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

export function decryptApiKey(encrypted: string): string {
  const key = getEncryptionKey();

  // Extract IV, authTag, and encrypted data
  const iv = Buffer.from(encrypted.slice(0, IV_LENGTH * 2), "hex");
  const authTag = Buffer.from(
    encrypted.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
    "hex"
  );
  const encryptedData = encrypted.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function extractLastFour(apiKey: string): string {
  // Handle OpenAI key format: sk-xxx...xxxx
  // Return last 4 characters
  return apiKey.slice(-4);
}

export function maskApiKey(keyLast4: string): string {
  return `sk-...${keyLast4}`;
}

async function createServiceClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
}

export interface ApiKeyInfo {
  hasKey: boolean;
  keyLast4: string | null;
  maskedKey: string | null;
}

export async function getApiKeyInfo(userId: string): Promise<ApiKeyInfo> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("key_last_4")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { hasKey: false, keyLast4: null, maskedKey: null };
  }

  return {
    hasKey: true,
    keyLast4: data.key_last_4,
    maskedKey: maskApiKey(data.key_last_4),
  };
}

export async function getApiKey(userId: string): Promise<string | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return decryptApiKey(data.encrypted_key);
}

export async function setApiKey(userId: string, plainKey: string): Promise<void> {
  const supabase = await createServiceClient();
  const encrypted = encryptApiKey(plainKey);
  const keyLast4 = extractLastFour(plainKey);

  // Use upsert to handle both insert and update cases
  const { error } = await supabase.from("api_keys").upsert(
    {
      user_id: userId,
      encrypted_key: encrypted,
      key_last_4: keyLast4,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error(`Failed to save API key: ${error.message}`);
  }
}

export async function deleteApiKey(userId: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("api_keys").delete().eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

export async function hasApiKey(userId: string): Promise<boolean> {
  const info = await getApiKeyInfo(userId);
  return info.hasKey;
}
