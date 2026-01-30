"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/ConfirmDialog";

interface UserWithUsage {
  id: string;
  email: string;
  displayName: string | null;
  tokensUsed: number;
  dailyTokenLimit: number;
  requestsPerMinute: number;
  tier: string;
  abuseFlags: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    dailyTokenLimit: 0,
    requestsPerMinute: 0,
    tier: "",
  });
  const { confirm, dialogProps } = useConfirmDialog();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied. Admin privileges required.");
        } else {
          setError("Failed to load users");
        }
        return;
      }
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
    }
  }, [authLoading, user, fetchUsers]);

  const handleEdit = (u: UserWithUsage) => {
    setEditingUser(u.id);
    setEditValues({
      dailyTokenLimit: u.dailyTokenLimit,
      requestsPerMinute: u.requestsPerMinute,
      tier: u.tier,
    });
  };

  const handleSave = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      setEditingUser(null);
      fetchUsers();
    } catch {
      alert("Failed to update user");
    }
  };

  const handleClearFlags = async (userId: string) => {
    const confirmed = await confirm({
      title: "Clear Abuse Flags",
      message: "Clear all abuse flags for this user?",
      variant: "warning",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to clear flags");
      }
      fetchUsers();
    } catch {
      alert("Failed to clear abuse flags");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-rose-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">{error || "Please sign in."}</p>
          <Link
            href="/admin"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
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
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent">
            User Management
          </h1>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">User</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Tokens Used</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Daily Limit</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Rate Limit</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Tier</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Flags</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-slate-200">{u.email}</div>
                        {u.displayName && (
                          <div className="text-xs text-slate-500">{u.displayName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.tokensUsed.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <input
                          type="number"
                          value={editValues.dailyTokenLimit}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              dailyTokenLimit: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-24 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-200"
                        />
                      ) : (
                        <span className="text-slate-300">{u.dailyTokenLimit.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <input
                          type="number"
                          value={editValues.requestsPerMinute}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              requestsPerMinute: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-200"
                        />
                      ) : (
                        <span className="text-slate-300">{u.requestsPerMinute}/min</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === u.id ? (
                        <select
                          value={editValues.tier}
                          onChange={(e) => setEditValues({ ...editValues, tier: e.target.value })}
                          className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-200"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.tier === "premium"
                              ? "bg-purple-500/20 text-purple-300"
                              : u.tier === "pro"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {u.tier}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.abuseFlags > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300">
                          {u.abuseFlags}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editingUser === u.id ? (
                          <>
                            <button
                              onClick={() => handleSave(u.id)}
                              className="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-2 py-1 text-xs rounded bg-slate-600 hover:bg-slate-500 text-white"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(u)}
                              className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white"
                            >
                              Edit
                            </button>
                            {u.abuseFlags > 0 && (
                              <button
                                onClick={() => handleClearFlags(u.id)}
                                className="px-2 py-1 text-xs rounded bg-rose-600 hover:bg-rose-500 text-white"
                              >
                                Clear Flags
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
