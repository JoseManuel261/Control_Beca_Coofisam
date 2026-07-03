interface StatusBadgeProps {
  estado: string;
}

const estilos: Record<string, string> = {
  Pagado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Por Cursar': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function StatusBadge({ estado }: StatusBadgeProps) {
  const clase = estilos[estado] ?? estilos['Por Cursar'];
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium font-mono px-2 py-0.5 rounded-full border ${clase}`}
    >
      {estado}
    </span>
  );
}
