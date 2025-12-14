import { getServiceRoleClient } from "@/lib/supabase/admin";

export type SecretPayload = {
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
};

export type SecretStatus = {
  hasOpenAIKey: boolean;
  hasElevenLabsKey: boolean;
};

async function decryptSecret(secretId: string | null | undefined) {
  const supabaseAdmin = getServiceRoleClient();
  if (!secretId) return null;

  const { data, error } = await supabaseAdmin.rpc("decrypt_secret", {
    secret_id: secretId,
  });

  if (error) {
    console.error("Failed to decrypt secret");
    return null;
  }

  return data as string | null;
}

async function storeUserSecret(userId: string, provider: "openai" | "elevenlabs", secret: string) {
  const supabaseAdmin = getServiceRoleClient();
  const { data, error } = await supabaseAdmin.rpc("store_user_secret", {
    p_user_id: userId,
    p_provider: provider,
    p_secret: secret,
  });

  if (error) {
    console.error(`Failed to store ${provider} secret`);
    throw error;
  }

  return data as string;
}

async function deleteUserSecret(userId: string, provider: "openai" | "elevenlabs") {
  const supabaseAdmin = getServiceRoleClient();
  const { error } = await supabaseAdmin.rpc("delete_user_secret", {
    p_user_id: userId,
    p_provider: provider,
  });

  if (error) {
    console.error(`Failed to delete ${provider} secret`);
    throw error;
  }
}

export async function getOpenAIKeyForUser(userId: string) {
  const supabaseAdmin = getServiceRoleClient();
  const { data } = await supabaseAdmin
    .from("user_secrets")
    .select("openai_secret_id")
    .eq("user_id", userId)
    .maybeSingle();

  const decrypted = await decryptSecret(data?.openai_secret_id);
  if (decrypted) return decrypted;

  return process.env.OPENAI_API_KEY ?? null;
}

export async function getElevenLabsKeyForUser(userId: string) {
  const supabaseAdmin = getServiceRoleClient();
  const { data } = await supabaseAdmin
    .from("user_secrets")
    .select("elevenlabs_secret_id")
    .eq("user_id", userId)
    .maybeSingle();

  const decrypted = await decryptSecret(data?.elevenlabs_secret_id);
  if (decrypted) return decrypted;

  return process.env.ELEVENLABS_API_KEY ?? null;
}

export async function getUserSecretStatus(userId: string): Promise<SecretStatus> {
  const supabaseAdmin = getServiceRoleClient();
  const { data } = await supabaseAdmin
    .from("user_secrets")
    .select("openai_secret_id, elevenlabs_secret_id")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    hasOpenAIKey: !!data?.openai_secret_id,
    hasElevenLabsKey: !!data?.elevenlabs_secret_id,
  };
}

export async function storeSecretsForUser(userId: string, secrets: SecretPayload) {
  const supabaseAdmin = getServiceRoleClient();

  // Ensure profile exists
  await supabaseAdmin.from("profiles").upsert(
    { id: userId, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );

  // Store each provided secret using vault helper functions
  const promises: Promise<unknown>[] = [];

  if (secrets.openaiApiKey) {
    promises.push(storeUserSecret(userId, "openai", secrets.openaiApiKey));
  }

  if (secrets.elevenlabsApiKey) {
    promises.push(storeUserSecret(userId, "elevenlabs", secrets.elevenlabsApiKey));
  }

  await Promise.all(promises);
}

export async function deleteSecretForUser(userId: string, provider: "openai" | "elevenlabs") {
  await deleteUserSecret(userId, provider);
}
