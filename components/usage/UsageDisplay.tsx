"use client";

import { useState, useEffect } from "react";
import type { UsageStats } from "@/lib/usage";

interface UsageDisplayProps {
  className?: string;
}

export function UsageDisplay({ className = "" }: UsageDisplayProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) {
        throw new Error("Failed to fetch usage stats");
      }
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch {
      setError("Unable to load usage stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 ${className}`}>
        <div className="text-slate-400 text-sm">Loading usage stats...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 ${className}`}>
        <div className="text-slate-400 text-sm">{error || "Unable to load usage stats"}</div>
      </div>
    );
  }

  const tokenPercentage = Math.min(100, (stats.tokensUsed / stats.dailyLimit) * 100);
  const tokenColorClass = getColorClass(tokenPercentage);

  return (
    <div className={`bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 ${className}`}>
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-cyan-300 mb-1">Usage</h2>
          <p className="text-sm text-slate-400 mb-4">
            Your token usage and limits. Resets daily at midnight UTC.
          </p>

          {/* Token Usage */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Tokens Used Today</span>
                <span className={tokenColorClass}>
                  {stats.tokensUsed.toLocaleString()} / {stats.dailyLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressBarColorClass(tokenPercentage)}`}
                  style={{ width: `${tokenPercentage}%` }}
                />
              </div>
              {tokenPercentage >= 80 && (
                <p className="mt-1 text-xs text-amber-400">
                  {tokenPercentage >= 100
                    ? "Daily limit reached. Resets at midnight UTC."
                    : "Approaching daily limit."}
                </p>
              )}
            </div>

            {/* Tier Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Plan:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierBadgeClass(stats.tier)}`}
              >
                {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)}
              </span>
            </div>

            {/* Rate Limit Info */}
            <div className="text-xs text-slate-500">
              <span>Rate limit: {stats.requestsPerMinuteLimit} requests/minute</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorClass(percentage: number): string {
  if (percentage >= 80) return "text-rose-400";
  if (percentage >= 50) return "text-amber-400";
  return "text-emerald-400";
}

function getProgressBarColorClass(percentage: number): string {
  if (percentage >= 80) return "bg-rose-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case "premium":
      return "bg-purple-500/20 border border-purple-500/50 text-purple-300";
    case "pro":
      return "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300";
    default:
      return "bg-slate-700 text-slate-400";
  }
}
