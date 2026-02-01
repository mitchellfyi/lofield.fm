"use client";

import { useTransportState } from "@/lib/audio/useVisualization";

export function MiniTimeline() {
  const transport = useTransportState();
  const totalBars = 32;
  const currentBar = (transport.bar - 1) % totalBars;
  const section = Math.floor(currentBar / 8);
  const sectionLabels = ["A", "B", "C", "D"];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
          transport.playing ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-400"
        }`}
      >
        {sectionLabels[section]}
      </div>
      <div className="text-right">
        <div className="text-xs font-mono text-white tabular-nums">
          {transport.bar}/{totalBars}
        </div>
        <div className="text-[10px] text-slate-400">{transport.bpm} BPM</div>
      </div>
    </div>
  );
}
