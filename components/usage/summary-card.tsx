"use client";

type SummaryCardProps = {
  title: string;
  children: React.ReactNode;
};

export function SummaryCard({ title, children }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

type MetricItemProps = {
  label: string;
  value: string | number;
  subtitle?: string;
};

export function MetricItem({ label, value, subtitle }: MetricItemProps) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
