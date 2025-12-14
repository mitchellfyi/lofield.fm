import { SettingsPanel } from "@/components/settings-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm text-emerald-700 hover:text-emerald-800 underline"
          >
            ← Back to Studio
          </Link>
          <p className="text-sm uppercase tracking-wide text-emerald-700">
            Lofield Studio · Settings
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Settings</h1>
          <p className="max-w-3xl text-base text-slate-600">
            Manage your API keys, model preferences, and default generation
            settings. API keys are encrypted and stored securely in Supabase
            Vault.
          </p>
        </div>

        <SettingsPanel userEmail={session.user.email ?? session.user.id} />
      </div>
    </main>
  );
}
