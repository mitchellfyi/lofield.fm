"use client";

interface TweakSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

export function TweakSlider({ label, value, min, max, step, unit, onChange }: TweakSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs font-medium text-slate-300">{label}</span>
      <div className="flex-1 relative py-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer touch-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30 [&::-webkit-slider-thumb]:hover:bg-cyan-400 [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-cyan-500/30"
          style={{
            background: `linear-gradient(to right, rgb(8 145 178) 0%, rgb(34 211 238) ${percentage}%, rgb(30 41 59) ${percentage}%, rgb(30 41 59) 100%)`,
          }}
        />
      </div>
      <span className="w-16 text-right text-xs font-mono text-cyan-400 tabular-nums">
        {value}
        {unit}
      </span>
    </div>
  );
}
