"use client";

import { useMemo, useState } from "react";
import { diffLines, type Change } from "diff";

interface DiffViewProps {
  oldCode: string;
  newCode: string;
  oldLabel?: string;
  newLabel?: string;
}

export function DiffView({
  oldCode,
  newCode,
  oldLabel = "Previous",
  newLabel = "Current",
}: DiffViewProps) {
  const [mode, setMode] = useState<"unified" | "side-by-side">("unified");

  const diff = useMemo(() => {
    return diffLines(oldCode, newCode);
  }, [oldCode, newCode]);

  // Count changes
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diff.forEach((part) => {
      const lines = part.value.split("\n").filter((line) => line !== "").length;
      if (part.added) {
        added += lines;
      } else if (part.removed) {
        removed += lines;
      }
    });
    return { added, removed };
  }, [diff]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header with mode toggle and stats */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-slate-800/50">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Diff View</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
              +{stats.added} added
            </span>
            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded">
              -{stats.removed} removed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setMode("unified")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              mode === "unified"
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setMode("side-by-side")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              mode === "side-by-side"
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Side by Side
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {mode === "unified" ? (
          <UnifiedDiff diff={diff} />
        ) : (
          <SideBySideDiff diff={diff} oldLabel={oldLabel} newLabel={newLabel} />
        )}
      </div>
    </div>
  );
}

interface UnifiedDiffProps {
  diff: Change[];
}

function UnifiedDiff({ diff }: UnifiedDiffProps) {
  let lineNumber = 0;

  return (
    <div className="font-mono text-sm">
      {diff.map((part, index) => {
        const lines = part.value.split("\n");
        // Remove last empty line from split
        if (lines[lines.length - 1] === "") {
          lines.pop();
        }

        return lines.map((line, lineIndex) => {
          if (!part.added && !part.removed) {
            lineNumber++;
          } else if (part.added) {
            lineNumber++;
          }

          const bgColor = part.added
            ? "bg-emerald-500/10"
            : part.removed
              ? "bg-rose-500/10"
              : "";
          const textColor = part.added
            ? "text-emerald-400"
            : part.removed
              ? "text-rose-400"
              : "text-slate-300";
          const prefix = part.added ? "+" : part.removed ? "-" : " ";

          return (
            <div
              key={`${index}-${lineIndex}`}
              className={`flex ${bgColor} border-l-2 ${
                part.added
                  ? "border-emerald-500"
                  : part.removed
                    ? "border-rose-500"
                    : "border-transparent"
              }`}
            >
              <span className="w-12 flex-shrink-0 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-700">
                {!part.removed ? lineNumber : ""}
              </span>
              <span className={`w-6 flex-shrink-0 text-center py-0.5 ${textColor}`}>
                {prefix}
              </span>
              <pre className={`flex-1 px-2 py-0.5 ${textColor} whitespace-pre-wrap break-all`}>
                {line || " "}
              </pre>
            </div>
          );
        });
      })}
    </div>
  );
}

interface SideBySideDiffProps {
  diff: Change[];
  oldLabel: string;
  newLabel: string;
}

function SideBySideDiff({ diff, oldLabel, newLabel }: SideBySideDiffProps) {
  // Build left and right lines
  const leftLines: { text: string; type: "removed" | "context" }[] = [];
  const rightLines: { text: string; type: "added" | "context" }[] = [];

  diff.forEach((part) => {
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") {
      lines.pop();
    }

    if (part.added) {
      lines.forEach((line) => {
        rightLines.push({ text: line, type: "added" });
      });
    } else if (part.removed) {
      lines.forEach((line) => {
        leftLines.push({ text: line, type: "removed" });
      });
    } else {
      lines.forEach((line) => {
        leftLines.push({ text: line, type: "context" });
        rightLines.push({ text: line, type: "context" });
      });
    }
  });

  // Pad to equal length
  const maxLength = Math.max(leftLines.length, rightLines.length);
  while (leftLines.length < maxLength) {
    leftLines.push({ text: "", type: "context" });
  }
  while (rightLines.length < maxLength) {
    rightLines.push({ text: "", type: "context" });
  }

  return (
    <div className="flex font-mono text-sm">
      {/* Left side (old) */}
      <div className="w-1/2 border-r border-slate-700">
        <div className="sticky top-0 px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-semibold text-slate-400">
          {oldLabel}
        </div>
        {leftLines.map((line, index) => {
          const bgColor = line.type === "removed" ? "bg-rose-500/10" : "";
          const textColor = line.type === "removed" ? "text-rose-400" : "text-slate-300";

          return (
            <div key={index} className={`flex ${bgColor}`}>
              <span className="w-10 flex-shrink-0 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-700">
                {index + 1}
              </span>
              <pre className={`flex-1 px-2 py-0.5 ${textColor} whitespace-pre-wrap break-all`}>
                {line.text || " "}
              </pre>
            </div>
          );
        })}
      </div>

      {/* Right side (new) */}
      <div className="w-1/2">
        <div className="sticky top-0 px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-semibold text-slate-400">
          {newLabel}
        </div>
        {rightLines.map((line, index) => {
          const bgColor = line.type === "added" ? "bg-emerald-500/10" : "";
          const textColor = line.type === "added" ? "text-emerald-400" : "text-slate-300";

          return (
            <div key={index} className={`flex ${bgColor}`}>
              <span className="w-10 flex-shrink-0 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-700">
                {index + 1}
              </span>
              <pre className={`flex-1 px-2 py-0.5 ${textColor} whitespace-pre-wrap break-all`}>
                {line.text || " "}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
