"use client";

type BarChartProps = {
  data: Array<{ label: string; value: number; secondaryValue?: number }>;
  height?: number;
  showSecondary?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (value: number) => string;
};

export function BarChart({
  data,
  height = 200,
  showSecondary = false,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary",
  formatValue = (v) => v.toLocaleString(),
}: BarChartProps) {
  const maxValue = Math.max(
    ...data.map((d) =>
      showSecondary ? (d.secondaryValue ?? 0) : (d.value ?? 0)
    )
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-emerald-600"></div>
          <span className="text-slate-600">{primaryLabel}</span>
        </div>
        {showSecondary && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-600"></div>
            <span className="text-slate-600">{secondaryLabel}</span>
          </div>
        )}
      </div>
      <div
        className="relative flex items-end gap-1"
        style={{ height: `${height}px` }}
      >
        {data.map((item, i) => {
          const displayValue = showSecondary
            ? (item.secondaryValue ?? 0)
            : item.value;
          const barHeight =
            maxValue > 0 ? (displayValue / maxValue) * height : 0;

          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center"
            >
              <div
                className={`w-full rounded-t transition-all ${
                  showSecondary ? "bg-blue-600" : "bg-emerald-600"
                } hover:opacity-80`}
                style={{ height: `${barHeight}px` }}
              />
              <div className="absolute bottom-0 left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                {item.label}: {formatValue(displayValue)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
