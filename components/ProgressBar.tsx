interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  compact?: boolean;
}

export function ProgressBar({ value, max, label, compact = false }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const isComplete = percent >= 100;

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {label && !compact && (
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500 font-mono">{label}</span>
          <span className="text-zinc-400 font-mono tabular-nums">{percent}%</span>
        </div>
      )}
      <div className={`w-full ${compact ? 'h-1' : 'h-1.5'} bg-zinc-800/70 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
