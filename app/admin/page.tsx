"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  flaggedUsers: number;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          if (res.status === 403) {
            setError("Access denied. Admin privileges required.");
          } else {
            setError("Failed to load admin stats");
          }
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchStats();
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-cyan-300 mb-4">Authentication Required</h1>
          <p className="text-slate-400 mb-6">Please sign in to access the admin panel.</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-rose-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            href="/studio"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200"
          >
            Back to Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-purple-300 transition-colors mb-4"
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage users, quotas, and monitor system usage.
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
              <div className="text-3xl font-bold text-purple-300">{stats.totalUsers}</div>
              <div className="text-sm text-slate-400">Total Users</div>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
              <div className="text-3xl font-bold text-emerald-300">{stats.activeToday}</div>
              <div className="text-sm text-slate-400">Active Today</div>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-6">
              <div className="text-3xl font-bold text-rose-300">{stats.flaggedUsers}</div>
              <div className="text-sm text-slate-400">Flagged Users</div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="space-y-4">
          <Link
            href="/admin/users"
            className="block bg-slate-900/50 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-800/50 border border-purple-500/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-purple-300">User Management</h2>
                <p className="text-sm text-slate-400">
                  View users, adjust quotas, and manage abuse flags.
                </p>
              </div>
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
