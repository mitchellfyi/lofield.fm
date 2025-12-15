"use client";

type StackedBarChartProps = {
  data: Array<{
    label: string;
    values: Array<{ value: number; color: string; name: string }>;
  }>;
  height?: number;
  formatValue?: (value: number) => string;
};

export function StackedBarChart({
  data,
  height = 200,
  formatValue = (v) => v.toLocaleString(),
}: StackedBarChartProps) {
  // Calculate max total value across all bars
  const maxValue = Math.max(
    ...data.map((d) => d.values.reduce((sum, v) => sum + (v.value ?? 0), 0)),
    1
  );

  // Get unique series names for legend
  const seriesNames = Array.from(
    new Set(data.flatMap((d) => d.values.map((v) => v.name)))
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
        {seriesNames.map((name, i) => {
          const color = data[0]?.values.find((v) => v.name === name)?.color;
          return (
            <div key={i} className="flex items-center gap-1">
              <div
                className="h-3 w-3 rounded"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-slate-600">{name}</span>
            </div>
          );
        })}
      </div>
      <div
        className="relative flex items-end gap-1"
        style={{ height: `${height}px` }}
      >
        {data.map((item, i) => {
          const total = item.values.reduce((sum, v) => sum + v.value, 0);
          const barHeight = maxValue > 0 ? (total / maxValue) * height : 0;

          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
            >
              <div
                className="flex w-full flex-col-reverse rounded-t"
                style={{ height: `${barHeight}px` }}
              >
                {item.values.map((segment, j) => {
                  const segmentHeight =
                    total > 0 ? (segment.value / total) * barHeight : 0;
                  return (
                    <div
                      key={j}
                      className="w-full transition-all hover:opacity-80"
                      style={{
                        height: `${segmentHeight}px`,
                        backgroundColor: segment.color,
                      }}
                    />
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                <div>{item.label}</div>
                {item.values.map((v, j) => (
                  <div key={j}>
                    {v.name}: {formatValue(v.value)}
                  </div>
                ))}
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
