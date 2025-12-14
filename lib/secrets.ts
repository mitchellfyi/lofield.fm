import { getServiceRoleClient } from "@/lib/supabase/admin";

type SecretPayload = {
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
};

async function decryptSecret(secretId: string | null | undefined) {
  const supabaseAdmin = getServiceRoleClient();
  if (!secretId) return null;

  const { data, error } = await supabaseAdmin.rpc("decrypt_secret", {
    secret_id: secretId,
  });

  if (error) {
    console.error("Failed to decrypt secret", error);
    return null;
  }

  return data as string | null;
}

async function createSecret(value?: string) {
  const supabaseAdmin = getServiceRoleClient();
  if (!value) return null;

  const { data, error } = await supabaseAdmin.rpc("create_secret", {
    secret_value: value,
  });

  if (error) {
    console.error("Failed to create secret", error);
    return null;
  }

  return data as string | null;
}

export async function getOpenAIKeyForUser(userId: string) {
  const supabaseAdmin = getServiceRoleClient();
  const { data } = await supabaseAdmin
    .from("user_secrets")
    .select("openai_secret_id, openai_api_key")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.openai_api_key) {
    return data.openai_api_key as string;
  }

  const decrypted = await decryptSecret(data?.openai_secret_id);
  if (decrypted) return decrypted;

  return process.env.OPENAI_API_KEY ?? null;
}

export async function storeSecretsForUser(userId: string, secrets: SecretPayload) {
  const supabaseAdmin = getServiceRoleClient();
  await supabaseAdmin.from("profiles").upsert(
    { id: userId, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );

  const [openaiSecretId, elevenlabsSecretId] = await Promise.all([
    createSecret(secrets.openaiApiKey),
    createSecret(secrets.elevenlabsApiKey),
  ]);

  const { error } = await supabaseAdmin
    .from("user_secrets")
    .upsert(
      {
        user_id: userId,
        openai_secret_id: openaiSecretId,
        elevenlabs_secret_id: elevenlabsSecretId,
        openai_api_key: secrets.openaiApiKey ?? null,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    throw error;
  }
}
