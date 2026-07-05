interface PresupuestoBarProps {
  categoria: string;
  gastado: number;
  limite: number | null;
}

export function PresupuestoBar({ categoria, gastado, limite }: PresupuestoBarProps) {
  if (!limite || limite <= 0) {
    return (
      <div className="flex items-center justify-between text-xs text-zinc-500 py-1.5">
        <span>{categoria}</span>
        <span className="font-mono">${gastado.toLocaleString('es-CO')} · sin límite definido</span>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((gastado / limite) * 100));
  const color =
    percent >= 100 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor =
    percent >= 100 ? 'text-red-400' : percent >= 75 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-1 py-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{categoria}</span>
        <span className={`font-mono tabular-nums ${textColor}`}>
          ${gastado.toLocaleString('es-CO')} / ${limite.toLocaleString('es-CO')}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800/70 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
