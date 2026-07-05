'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { agregarGastoDiario, eliminarGastoDiario } from '@/app/finanzas/actions';
import { CATEGORIAS_GASTOS_DIARIOS } from '@/lib/finanzas/categorias';
import type { GastoDiario } from '@/lib/finanzas/types';
import type { useToasts } from '@/lib/useToasts';
import { ConfirmButton } from '@/components/finanzas/ConfirmButton';

interface GastosDiariosPanelProps {
  gastos: GastoDiario[];
  toasts: ReturnType<typeof useToasts>;
}

export function GastosDiariosPanel({ gastos, toasts }: GastosDiariosPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  const ordenados = [...gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const handleAgregar = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await agregarGastoDiario(formData);
        toasts.success('Gasto registrado.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el gasto.');
      }
    });
  };

  const handleEliminar = (id: string) => {
    startTransition(async () => {
      try {
        await eliminarGastoDiario(id);
        toasts.success('Gasto eliminado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo eliminar.');
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-fenix text-xl text-zinc-300 font-normal">Gastos Diarios</h2>
        <span className="text-xs font-mono text-zinc-500">
          Total del mes: <span className="text-zinc-300">${total.toLocaleString('es-CO')}</span>
        </span>
      </div>

      {/* Formulario rápido - mobile first: todo en una columna, inputs grandes */}
      <form
        action={handleAgregar}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <input
            type="text"
            name="descripcion"
            placeholder="¿En qué gastaste? Ej: Almuerzo corriente"
            required
            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-3 rounded-xl text-sm text-zinc-200 transition-all"
          />
          <input
            type="number"
            name="monto"
            min={0}
            placeholder="$"
            required
            inputMode="numeric"
            className="w-full sm:w-32 bg-zinc-950/60 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-3 rounded-xl text-sm text-zinc-200 font-mono transition-all"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3">
          <select
            name="categoria"
            defaultValue={CATEGORIAS_GASTOS_DIARIOS[0]}
            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-3 rounded-xl text-sm text-zinc-300 transition-all"
          >
            {CATEGORIAS_GASTOS_DIARIOS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="fecha"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-3 rounded-xl text-sm text-zinc-300 font-mono transition-all"
          />
          <button
            type="submit"
            disabled={isPending}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-3 rounded-xl transition-all"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span className="text-sm">Registrar</span>
          </button>
        </div>
        {formError && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </form>

      {/* Lista */}
      <div className="rounded-2xl border border-zinc-900 divide-y divide-zinc-900">
        {ordenados.length === 0 && (
          <p className="py-8 text-center text-zinc-600 text-xs font-mono">
            No hay gastos diarios registrados en este periodo.
          </p>
        )}
        {ordenados.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/20 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm text-zinc-200 truncate">{g.descripcion}</p>
              <p className="text-xs font-mono text-zinc-500">
                {new Date(g.fecha).toLocaleDateString('es-CO')} · {g.categoria}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-mono tabular-nums text-zinc-300">
                ${Number(g.monto).toLocaleString('es-CO')}
              </span>
              <ConfirmButton onConfirm={() => handleEliminar(g.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
