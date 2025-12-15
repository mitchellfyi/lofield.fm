"use client";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
};

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-600">From:</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      />
      <label className="text-sm text-slate-600">To:</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="rounded border border-slate-300 px-2 py-1 text-sm"
      />
    </div>
  );
}
