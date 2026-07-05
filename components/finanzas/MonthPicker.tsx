'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { etiquetaPeriodo } from '@/lib/finanzas/categorias';

interface MonthPickerProps {
  anioMes: string;
  onChange: (anioMes: string) => void;
}

function moverPeriodo(anioMes: string, delta: number): string {
  const [anio, mes] = anioMes.split('-').map(Number);
  const fecha = new Date(anio, (mes ?? 1) - 1 + delta, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthPicker({ anioMes, onChange }: MonthPickerProps) {
  return (
    <div className="inline-flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5">
      <button
        type="button"
        onClick={() => onChange(moverPeriodo(anioMes, -1))}
        className="text-zinc-500 hover:text-zinc-200 transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-mono text-zinc-300 min-w-[9rem] text-center capitalize">
        {etiquetaPeriodo(anioMes)}
      </span>
      <button
        type="button"
        onClick={() => onChange(moverPeriodo(anioMes, 1))}
        className="text-zinc-500 hover:text-zinc-200 transition-colors"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
