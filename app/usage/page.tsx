"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DateRangePicker } from "@/components/usage/date-range-picker";
import { MultiSelect } from "@/components/usage/multi-select";
import { SummaryCard, MetricItem } from "@/components/usage/summary-card";
import { BarChart } from "@/components/usage/bar-chart";
import { DataTable } from "@/components/usage/data-table";
import { DetailDrawer } from "@/components/usage/detail-drawer";

// Helper to get default date range (last 30 days in Europe/London timezone)
function getDefaultDateRange() {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

// Helper to export data as CSV
function exportToCSV(data: unknown[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0] as object);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => (row as Record<string, unknown>)[header])
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ProviderSummary = {
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  costUsdUnknownCount: number;
  errorCount: number;
  errorRate: number;
};

type ModelSummary = {
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  costUsdUnknownCount: number;
};

type ChatSummary = {
  chatId: string;
  title: string;
  lastActivity: string;
  openaiTokens: number;
  openaiCost: number;
  elevenCredits: number;
  tracksCount: number;
};

type TrackSummary = {
  trackId: string;
  title: string;
  chatId: string;
  lengthMs: number;
  openaiTokensUsed: number;
  elevenAudioSeconds: number;
  elevenCredits: number;
  totalCost: number;
};

type DailyMetrics = {
  date: string;
  provider?: string;
  model?: string;
  actionType?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  requestCount: number;
  costUsd: number;
  errorCount: number;
};

type UsageEvent = {
  id: string;
  occurredAt: string;
  chatId?: string;
  trackId?: string;
  actionGroupId: string;
  actionType: string;
  provider: string;
  providerOperation: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  creditsUsed?: number;
  audioSeconds?: number;
  costUsd?: number;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  latencyMs?: number;
};

type SubscriptionData = {
  creditsUsedCurrentPeriod: number;
  creditsLimitCurrentPeriod: number;
  creditsRemaining: number;
  nextResetUnix: number;
  tier?: string;
  status?: string;
};

export default function UsagePage() {
  // Date range
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Filters
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "openai",
    "elevenlabs",
  ]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([
    "ok",
    "error",
  ]);

  // Data
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    byProvider: ProviderSummary[];
    topModels: ModelSummary[];
    counts: {
      chatsTouched: number;
      tracksGenerated: number;
      refineActions: number;
      generateActions: number;
    };
  } | null>(null);
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [dailyVolumeData, setDailyVolumeData] = useState<DailyMetrics[]>([]);
  const [chatData, setChatData] = useState<ChatSummary[]>([]);
  const [trackData, setTrackData] = useState<TrackSummary[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );

  // Chart toggle
  const [showTokensInChart, setShowTokensInChart] = useState(false);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerEvents, setDrawerEvents] = useState<UsageEvent[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Available options (populated from data)
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableActionTypes, setAvailableActionTypes] = useState<string[]>(
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch summary
      const summaryRes = await fetch(
        `/api/usage/summary?start=${startDate}&end=${endDate}`
      );
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);

        // Populate available models
        const models = summaryData.topModels.map((m: ModelSummary) => m.model);
        setAvailableModels(models);
        if (selectedModels.length === 0) {
          setSelectedModels(models);
        }
      }

      // Fetch daily cost data (grouped by provider)
      const dailyCostRes = await fetch(
        `/api/usage/daily?start=${startDate}&end=${endDate}&groupBy=provider`
      );
      if (dailyCostRes.ok) {
        const dailyCostData = await dailyCostRes.json();
        setDailyData(dailyCostData.daily);
      }

      // Fetch daily volume data (grouped by action_type)
      const dailyVolumeRes = await fetch(
        `/api/usage/daily?start=${startDate}&end=${endDate}&groupBy=action_type`
      );
      if (dailyVolumeRes.ok) {
        const dailyVolumeDataRes = await dailyVolumeRes.json();
        setDailyVolumeData(dailyVolumeDataRes.daily);

        // Populate available action types
        const actionTypes = [
          ...new Set(
            dailyVolumeDataRes.daily
              .map((d: DailyMetrics) => d.actionType)
              .filter(Boolean)
          ),
        ] as string[];
        setAvailableActionTypes(actionTypes);
        if (selectedActionTypes.length === 0) {
          setSelectedActionTypes(actionTypes);
        }
      }

      // Fetch chat data
      const chatRes = await fetch(
        `/api/usage/chats?start=${startDate}&end=${endDate}`
      );
      if (chatRes.ok) {
        const chatDataRes = await chatRes.json();
        setChatData(chatDataRes.chats);
      }

      // Fetch track data
      const trackRes = await fetch(
        `/api/usage/tracks?start=${startDate}&end=${endDate}`
      );
      if (trackRes.ok) {
        const trackDataRes = await trackRes.json();
        setTrackData(trackDataRes.tracks);
      }

      // Fetch ElevenLabs subscription
      const subRes = await fetch("/api/usage/elevenlabs/subscription");
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.ok) {
          setSubscription(subData.subscription);
        }
      }
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    startDate,
    endDate,
    selectedProviders,
    selectedModels,
    selectedActionTypes,
    selectedStatus,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function openChatDrawer(chat: ChatSummary) {
    setDrawerTitle(`Chat: ${chat.title}`);
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const res = await fetch(
        `/api/usage/events?start=${startDate}&end=${endDate}&chat_id=${chat.chatId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDrawerEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching chat events:", error);
    } finally {
      setDrawerLoading(false);
    }
  }

  async function openTrackDrawer(track: TrackSummary) {
    setDrawerTitle(`Track: ${track.title}`);
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const res = await fetch(
        `/api/usage/events?start=${startDate}&end=${endDate}&track_id=${track.trackId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDrawerEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching track events:", error);
    } finally {
      setDrawerLoading(false);
    }
  }

  // Compute metrics for display
  const openaiSummary = summary?.byProvider.find(
    (p) => p.provider === "openai"
  );
  const elevenSummary = summary?.byProvider.find(
    (p) => p.provider === "elevenlabs"
  );

  // Prepare chart data
  const costChartData = dailyData.map((d) => ({
    label: d.date.substring(5), // MM-DD
    value: d.costUsd,
    secondaryValue:
      d.provider === "openai" ? (d.totalTokens ?? 0) : (d.creditsUsed ?? 0),
  }));

  const volumeChartData = dailyVolumeData
    .filter(
      (d) =>
        d.actionType === "refine_prompt" || d.actionType === "generate_track"
    )
    .reduce<
      Array<{ label: string; refineCount: number; generateCount: number }>
    >((acc, d) => {
      const existing = acc.find((item) => item.label === d.date.substring(5));
      if (existing) {
        if (d.actionType === "refine_prompt") {
          existing.refineCount = d.requestCount;
        } else if (d.actionType === "generate_track") {
          existing.generateCount = d.requestCount;
        }
      } else {
        acc.push({
          label: d.date.substring(5),
          refineCount: d.actionType === "refine_prompt" ? d.requestCount : 0,
          generateCount: d.actionType === "generate_track" ? d.requestCount : 0,
        });
      }
      return acc;
    }, []);

  // Filter models and chats/tracks based on filters
  const filteredModels =
    summary?.topModels.filter(
      (m) =>
        selectedProviders.includes(m.provider) &&
        selectedModels.includes(m.model)
    ) ?? [];

  const filteredChats = chatData;
  const filteredTracks = trackData;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm text-emerald-700 underline hover:text-emerald-800"
          >
            ← Back to Studio
          </Link>
          <p className="text-sm uppercase tracking-wide text-emerald-700">
            Lofield Studio · Usage
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Usage Dashboard
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Monitor your OpenAI and ElevenLabs usage, costs, and performance.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
            <div>
              <MultiSelect
                label="Providers"
                options={["openai", "elevenlabs"]}
                selected={selectedProviders}
                onChange={setSelectedProviders}
              />
            </div>
            <div>
              <MultiSelect
                label="Models"
                options={availableModels}
                selected={selectedModels}
                onChange={setSelectedModels}
              />
            </div>
            <div>
              <MultiSelect
                label="Action Types"
                options={availableActionTypes}
                selected={selectedActionTypes}
                onChange={setSelectedActionTypes}
              />
            </div>
            <div>
              <MultiSelect
                label="Status"
                options={["ok", "error"]}
                selected={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() =>
                  exportToCSV(
                    [
                      ...filteredModels.map((m) => ({
                        type: "model",
                        ...m,
                      })),
                      ...filteredChats.map((c) => ({
                        type: "chat",
                        ...c,
                      })),
                      ...filteredTracks.map((t) => ({
                        type: "track",
                        ...t,
                      })),
                    ],
                    `usage-${startDate}-to-${endDate}.csv`
                  )
                }
                className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Loading usage data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* OpenAI Summary */}
              <SummaryCard title="OpenAI">
                <MetricItem
                  label="Total Tokens"
                  value={openaiSummary?.totalTokens?.toLocaleString() ?? "0"}
                  subtitle={`In: ${openaiSummary?.inputTokens?.toLocaleString() ?? "0"} / Out: ${openaiSummary?.outputTokens?.toLocaleString() ?? "0"}`}
                />
                <MetricItem
                  label="Total Cost"
                  value={`$${(openaiSummary?.costUsd ?? 0).toFixed(4)}`}
                />
                <MetricItem
                  label="Avg Cost per Refine"
                  value={`$${(
                    (openaiSummary?.costUsd ?? 0) /
                    Math.max(1, summary?.counts.refineActions ?? 1)
                  ).toFixed(4)}`}
                />
                <MetricItem
                  label="Requests"
                  value={openaiSummary?.requestCount?.toLocaleString() ?? "0"}
                />
              </SummaryCard>

              {/* ElevenLabs Summary */}
              <SummaryCard title="ElevenLabs">
                <MetricItem
                  label="Credits Used"
                  value={(elevenSummary?.creditsUsed ?? 0).toFixed(0)}
                />
                <MetricItem
                  label="Audio Generated"
                  value={`${((elevenSummary?.audioSeconds ?? 0) / 60).toFixed(1)} min`}
                />
                <MetricItem
                  label="Credits Remaining"
                  value={
                    subscription
                      ? subscription.creditsRemaining.toLocaleString()
                      : "Unavailable"
                  }
                />
                <MetricItem
                  label="Requests"
                  value={elevenSummary?.requestCount?.toLocaleString() ?? "0"}
                />
              </SummaryCard>

              {/* Overall Summary */}
              <SummaryCard title="Overall">
                <MetricItem
                  label="Total Cost"
                  value={`$${(
                    (openaiSummary?.costUsd ?? 0) +
                    (elevenSummary?.costUsd ?? 0)
                  ).toFixed(4)}`}
                />
                <MetricItem
                  label="Chats Touched"
                  value={summary?.counts.chatsTouched ?? 0}
                />
                <MetricItem
                  label="Tracks Generated"
                  value={summary?.counts.tracksGenerated ?? 0}
                />
                <MetricItem
                  label="Unknown Cost Events"
                  value={
                    (openaiSummary?.costUsdUnknownCount ?? 0) +
                    (elevenSummary?.costUsdUnknownCount ?? 0)
                  }
                />
              </SummaryCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Daily Cost Chart */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Daily Cost
                  </h2>
                  <button
                    onClick={() => setShowTokensInChart(!showTokensInChart)}
                    className="text-xs text-emerald-600 underline hover:text-emerald-700"
                  >
                    {showTokensInChart ? "Show Cost" : "Show Tokens/Credits"}
                  </button>
                </div>
                <BarChart
                  data={costChartData}
                  showSecondary={showTokensInChart}
                  primaryLabel="Cost (USD)"
                  secondaryLabel="Tokens/Credits"
                  formatValue={(v) =>
                    showTokensInChart ? v.toLocaleString() : `$${v.toFixed(4)}`
                  }
                />
              </div>

              {/* Daily Volume Chart */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Daily Volume
                </h2>
                <BarChart
                  data={volumeChartData.map((d) => ({
                    label: d.label,
                    value: d.refineCount + d.generateCount,
                  }))}
                  primaryLabel="Actions"
                  formatValue={(v) => v.toLocaleString()}
                />
              </div>
            </div>

            {/* Tables */}
            <div className="space-y-6">
              {/* By Model */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Usage by Model
                </h2>
                <DataTable
                  columns={[
                    {
                      key: "model",
                      label: "Model",
                      render: (m: ModelSummary) => (
                        <span className="font-medium">{m.model}</span>
                      ),
                    },
                    {
                      key: "provider",
                      label: "Provider",
                      render: (m: ModelSummary) => (
                        <span className="text-slate-600">{m.provider}</span>
                      ),
                    },
                    {
                      key: "tokens",
                      label: "Tokens",
                      align: "right",
                      render: (m: ModelSummary) =>
                        m.totalTokens?.toLocaleString() ?? "-",
                    },
                    {
                      key: "cost",
                      label: "Cost",
                      align: "right",
                      render: (m: ModelSummary) => `$${m.costUsd.toFixed(4)}`,
                    },
                    {
                      key: "requests",
                      label: "Requests",
                      align: "right",
                      render: (m: ModelSummary) => m.requestCount,
                    },
                  ]}
                  data={filteredModels}
                  emptyMessage="No model usage in this date range"
                />
              </div>

              {/* By Chat */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Usage by Chat
                </h2>
                <DataTable
                  columns={[
                    {
                      key: "title",
                      label: "Chat Title",
                      render: (c: ChatSummary) => (
                        <span className="font-medium">{c.title}</span>
                      ),
                    },
                    {
                      key: "openaiTokens",
                      label: "OpenAI Tokens",
                      align: "right",
                      render: (c: ChatSummary) =>
                        c.openaiTokens.toLocaleString(),
                    },
                    {
                      key: "openaiCost",
                      label: "OpenAI Cost",
                      align: "right",
                      render: (c: ChatSummary) => `$${c.openaiCost.toFixed(4)}`,
                    },
                    {
                      key: "elevenCredits",
                      label: "ElevenLabs Credits",
                      align: "right",
                      render: (c: ChatSummary) => c.elevenCredits.toFixed(0),
                    },
                    {
                      key: "tracks",
                      label: "Tracks",
                      align: "right",
                      render: (c: ChatSummary) => c.tracksCount,
                    },
                  ]}
                  data={filteredChats}
                  onRowClick={openChatDrawer}
                  emptyMessage="No chat usage in this date range"
                />
              </div>

              {/* By Track */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Usage by Track
                </h2>
                <DataTable
                  columns={[
                    {
                      key: "title",
                      label: "Track Title",
                      render: (t: TrackSummary) => (
                        <span className="font-medium">{t.title}</span>
                      ),
                    },
                    {
                      key: "length",
                      label: "Length",
                      align: "right",
                      render: (t: TrackSummary) =>
                        `${(t.lengthMs / 1000).toFixed(0)}s`,
                    },
                    {
                      key: "openaiTokens",
                      label: "OpenAI Tokens",
                      align: "right",
                      render: (t: TrackSummary) =>
                        t.openaiTokensUsed.toLocaleString(),
                    },
                    {
                      key: "elevenAudio",
                      label: "Eleven Audio (s)",
                      align: "right",
                      render: (t: TrackSummary) =>
                        t.elevenAudioSeconds.toFixed(1),
                    },
                    {
                      key: "totalCost",
                      label: "Total Cost",
                      align: "right",
                      render: (t: TrackSummary) => `$${t.totalCost.toFixed(4)}`,
                    },
                  ]}
                  data={filteredTracks}
                  onRowClick={openTrackDrawer}
                  emptyMessage="No track usage in this date range"
                />
              </div>

              {/* Other Useful Info */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                  Additional Insights
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Error Rate (OpenAI)
                    </p>
                    <p className="text-base font-medium text-slate-900">
                      {((openaiSummary?.errorRate ?? 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Error Rate (ElevenLabs)
                    </p>
                    <p className="text-base font-medium text-slate-900">
                      {((elevenSummary?.errorRate ?? 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Avg Tokens per Refine
                    </p>
                    <p className="text-base font-medium text-slate-900">
                      {(
                        (openaiSummary?.totalTokens ?? 0) /
                        Math.max(1, summary?.counts.refineActions ?? 1)
                      ).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Cost per Generated Minute
                    </p>
                    <p className="text-base font-medium text-slate-900">
                      $
                      {(
                        ((openaiSummary?.costUsd ?? 0) +
                          (elevenSummary?.costUsd ?? 0)) /
                        Math.max(1, (elevenSummary?.audioSeconds ?? 0) / 60)
                      ).toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Detail Drawer */}
        <DetailDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={drawerTitle}
        >
          {drawerLoading && <p className="text-slate-600">Loading events...</p>}
          {!drawerLoading && drawerEvents.length === 0 && (
            <p className="text-slate-600">No events found.</p>
          )}
          {!drawerLoading && drawerEvents.length > 0 && (
            <div className="space-y-4">
              {drawerEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {event.provider} · {event.providerOperation}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        event.status === "ok"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="font-medium">Model:</span>{" "}
                      {event.model ?? "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Action:</span>{" "}
                      {event.actionType}
                    </div>
                    <div>
                      <span className="font-medium">Tokens:</span>{" "}
                      {event.totalTokens ?? "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Credits:</span>{" "}
                      {event.creditsUsed?.toFixed(1) ?? "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Cost:</span> $
                      {event.costUsd?.toFixed(6) ?? "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Latency:</span>{" "}
                      {event.latencyMs ?? "N/A"} ms
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Occurred:</span>{" "}
                      {new Date(event.occurredAt).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                      })}
                    </div>
                    {event.errorMessage && (
                      <div className="col-span-2">
                        <span className="font-medium">Error:</span>{" "}
                        {event.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailDrawer>
      </div>
    </main>
  );
}
