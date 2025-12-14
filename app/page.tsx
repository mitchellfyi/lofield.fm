import { AuthPanel } from "@/components/auth-panel";
import { ChatPanel } from "@/components/chat-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-emerald-700">
            Lofield Studio · Supabase Edition
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Draft lo-fi tracks with the Vercel AI SDK and Supabase
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            This baseline keeps the Next.js AI Chatbot streaming patterns, swaps
            in Supabase Auth + Postgres for persistence, and stores per-user
            provider keys with Supabase Vault.
          </p>
        </div>

        {session ? (
          <ChatPanel userEmail={session.user.email ?? session.user.id} />
        ) : (
          <AuthPanel />
        )}
      </div>
    </main>
  );
}
