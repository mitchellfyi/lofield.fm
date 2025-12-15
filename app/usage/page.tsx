"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Maximum number of days with usage to display in the daily usage list
const MAX_DISPLAYED_DAYS = 10;

type SubscriptionData = {
  creditsUsedCurrentPeriod: number;
  creditsLimitCurrentPeriod: number;
  creditsRemaining: number;
  nextResetUnix: number;
  tier?: string;
  status?: string;
};

type UsageStats = {
  dailyUsage: Array<{
    date: string;
    creditsUsed: number;
  }>;
};

export default function UsagePage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch subscription info
        const subResponse = await fetch("/api/usage/elevenlabs/subscription");
        if (!subResponse.ok) {
          const errorData = await subResponse.json();
          setError(errorData.error || "Failed to fetch subscription info");
        } else {
          const subData = await subResponse.json();
          if (subData.ok) {
            setSubscription(subData.subscription);
          }
        }

        // Fetch usage stats for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        const statsResponse = await fetch(
          `/api/usage/elevenlabs/stats?startDate=${startDateStr}&endDate=${endDateStr}`
        );
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          setStatsError(errorData.error || "Failed to fetch usage stats");
        } else {
          const statsData = await statsResponse.json();
          if (statsData.ok) {
            setStats(statsData.stats);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
            Lofield Studio · Usage
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            ElevenLabs Usage
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            View your ElevenLabs subscription details and daily credit usage
            stats.
          </p>
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Loading usage data...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-900">
              Could not fetch ElevenLabs subscription info
            </p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && subscription && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Subscription Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Credits Used</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {subscription.creditsUsedCurrentPeriod.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Credits Limit</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {subscription.creditsLimitCurrentPeriod.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Credits Remaining</p>
                <p className="text-2xl font-semibold text-emerald-700">
                  {subscription.creditsRemaining.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Reset Date</p>
                <p className="text-base font-medium text-slate-900">
                  {new Date(subscription.nextResetUnix).toLocaleDateString(
                    "en-GB",
                    {
                      timeZone: "Europe/London",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
              {subscription.tier && (
                <div>
                  <p className="text-sm text-slate-600">Tier</p>
                  <p className="text-base font-medium text-slate-900">
                    {subscription.tier}
                  </p>
                </div>
              )}
              {subscription.status && (
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-base font-medium text-slate-900">
                    {subscription.status}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (subscription.creditsUsedCurrentPeriod /
                        subscription.creditsLimitCurrentPeriod) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {(
                  (subscription.creditsUsedCurrentPeriod /
                    subscription.creditsLimitCurrentPeriod) *
                  100
                ).toFixed(1)}
                % of monthly credits used
              </p>
            </div>
          </div>
        )}

        {statsError && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-yellow-900">
              Could not fetch daily usage stats
            </p>
            <p className="mt-1 text-sm text-yellow-700">{statsError}</p>
          </div>
        )}

        {!loading && stats && stats.dailyUsage.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Daily Usage (Last 30 Days)
            </h2>
            <div className="space-y-2">
              {stats.dailyUsage
                .filter((day) => day.creditsUsed > 0)
                .reverse()
                .slice(0, MAX_DISPLAYED_DAYS)
                .map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <p className="text-sm text-slate-600">
                      {new Date(day.date).toLocaleDateString("en-GB", {
                        timeZone: "Europe/London",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {day.creditsUsed.toLocaleString()} credits
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!loading && !subscription && !error && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">
              No subscription data available. Please ensure your ElevenLabs API
              key is set in{" "}
              <Link
                href="/settings"
                className="text-emerald-700 hover:text-emerald-800 underline"
              >
                Settings
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
