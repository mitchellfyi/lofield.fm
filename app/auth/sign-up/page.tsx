import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default async function SignUpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/studio");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SignUpForm />
    </div>
  );
}
