import { StudioShell } from "@/components/studio/studio-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This should be handled by middleware, but double-check
  if (!user) {
    redirect("/");
  }

  return (
    <main className="h-screen bg-slate-50">
      <StudioShell userEmail={user.email ?? user.id} />
    </main>
  );
}
