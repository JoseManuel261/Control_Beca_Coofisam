import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  helper: string;
  accent?: 'default' | 'amber' | 'emerald';
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-zinc-100',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
};

export function StatCard({ icon: Icon, label, value, suffix, helper, accent = 'default' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tabular-nums tracking-tight ${accentClasses[accent]}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-zinc-500 font-mono">{suffix}</span>}
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed">{helper}</p>
    </div>
  );
}
