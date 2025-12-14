"use client";

import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useMemo } from "react";

export function AuthPanel() {
  const supabase = useMemo(() => createClient(), []);

  // Redirect to auth callback which handles provisioning and redirects to /app
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-lg backdrop-blur">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
        <p className="text-sm text-slate-600">
          Use Supabase Auth (Google or GitHub) to access your chats and store
          provider keys securely in Vault.
        </p>
      </div>
      <Auth
        supabaseClient={supabase}
        providers={["google", "github"]}
        appearance={{
          theme: ThemeSupa,
          style: {
            button: { borderRadius: 12 },
          },
        }}
        redirectTo={redirectTo}
      />
    </div>
  );
}
