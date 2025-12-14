import { StudioShell } from "@/components/studio/studio-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // This should be handled by middleware, but double-check
  if (!session) {
    redirect("/");
  }

  return (
    <main className="h-screen bg-slate-50">
      <StudioShell
        userId={session.user.id}
        userEmail={session.user.email ?? session.user.id}
      />
    </main>
  );
}
