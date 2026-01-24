"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useApiKey } from "@/lib/hooks/useApiKey";
import { ApiKeyModal } from "@/components/settings/ApiKeyModal";
import { UsageDisplay } from "@/components/usage/UsageDisplay";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { hasKey, maskedKey, loading: keyLoading, refresh } = useApiKey();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteKey = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your API key? You will need to add a new key to use AI chat."
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/api-keys", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete API key");
      }

      await refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setDeleting(false);
    }
  };

  const handleKeySuccess = async () => {
    await refresh();
  };

  // Show loading state
  if (authLoading || keyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-cyan-300 mb-4">Authentication Required</h1>
          <p className="text-slate-400 mb-6">Please sign in to access settings.</p>
          <Link
            href="/auth/sign-in"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Background effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Studio
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-500 bg-clip-text text-transparent">
              Settings
            </h1>
          </div>

          {/* API Key Section */}
          <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-800/50 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-cyan-300 mb-1">OpenAI API Key</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Your API key is used to power AI chat. It&apos;s encrypted and stored securely.
                </p>

                {deleteError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
                    {deleteError}
                  </div>
                )}

                {hasKey ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-sm">
                        {maskedKey}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-medium">
                        Active
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
                      >
                        Update Key
                      </button>
                      <button
                        onClick={handleDeleteKey}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-rose-300 border border-rose-500/30 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Delete Key"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="inline-block px-2 py-1 rounded-full bg-slate-700 text-slate-400 text-xs font-medium">
                      No key set
                    </span>

                    <div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
                      >
                        Add API Key
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Section */}
          <UsageDisplay className="mt-6" />

          {/* Account Info */}
          <div className="mt-6 bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">Account</h2>
            <div className="text-sm text-slate-400">
              <p>
                Signed in as <span className="text-slate-300">{user.email}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleKeySuccess}
      />
    </>
  );
}
