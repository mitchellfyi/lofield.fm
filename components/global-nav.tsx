"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useMemo } from "react";

type Props = {
  userEmail: string | null;
};

export function GlobalNav({ userEmail }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-lg font-semibold text-emerald-700">
            Lofield Studio
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-slate-700 sm:flex">
            <Link href="/library" className="transition hover:text-emerald-700">
              Library
            </Link>
            <Link href="/app" className="transition hover:text-emerald-700">
              App
            </Link>
            <Link href="/usage" className="transition hover:text-emerald-700">
              Usage
            </Link>
            <Link
              href="/settings"
              className="transition hover:text-emerald-700"
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="text-sm text-slate-600 hidden sm:inline">
                {userEmail}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
