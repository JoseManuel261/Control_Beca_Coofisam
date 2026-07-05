'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { agregarIngreso, eliminarIngreso, actualizarIngreso } from '@/app/finanzas/actions';
import { formatearFecha, hoyISO } from '@/lib/finanzas/fecha';
import type { Ingreso } from '@/lib/finanzas/types';
import type { useToasts } from '@/lib/useToasts';
import { ConfirmButton } from '@/components/finanzas/ConfirmButton';

interface IngresosPanelProps {
  ingresos: Ingreso[];
  toasts: ReturnType<typeof useToasts>;
}

export function IngresosPanel({ ingresos, toasts }: IngresosPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const total = ingresos.reduce((acc, i) => acc + Number(i.monto), 0);

  const handleAgregar = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await agregarIngreso(formData);
        toasts.success('Ingreso registrado.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el ingreso.');
      }
    });
  };

  const handleEditar = (id: string, campo: 'fuente' | 'monto', valor: string | number) => {
    startTransition(async () => {
      try {
        await actualizarIngreso(id, campo, valor);
        toasts.success('Ingreso actualizado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo actualizar.');
      }
    });
  };

  const handleEliminar = (id: string) => {
    startTransition(async () => {
      try {
        await eliminarIngreso(id);
        toasts.success('Ingreso eliminado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo eliminar.');
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-fenix text-xl text-zinc-300 font-normal">Ingresos</h2>
        <span className="text-xs font-mono text-emerald-400">
          Total: ${total.toLocaleString('es-CO')}
        </span>
      </div>

      <form action={handleAgregar} className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end text-xs">
        <input
          type="text"
          name="fuente"
          placeholder="Ej: Salario, freelance"
          required
          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 transition-all"
        />
        <input
          type="number"
          name="monto"
          min={0}
          placeholder="$"
          required
          className="w-full sm:w-28 bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 font-mono transition-all"
        />
        <input
          type="date"
          name="fecha"
          defaultValue={hoyISO()}
          className="w-full sm:w-36 bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 font-mono transition-all"
        />
        <button
          type="submit"
          disabled={isPending}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2.5 rounded-lg transition-all"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
        {formError && (
          <p className="col-span-2 sm:col-span-4 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-zinc-900 divide-y divide-zinc-900">
        {ingresos.length === 0 && (
          <p className="py-6 text-center text-zinc-600 text-xs font-mono">
            No hay ingresos registrados en este periodo.
          </p>
        )}
        {ingresos.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-900/20 transition-colors group">
            <div className="min-w-0">
              <input
                type="text"
                defaultValue={i.fuente}
                onBlur={(e) => {
                  const valor = e.target.value.trim();
                  if (valor && valor !== i.fuente) handleEditar(i.id, 'fuente', valor);
                }}
                className="w-full bg-transparent text-sm text-zinc-200 border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all truncate"
              />
              <p className="text-xs font-mono text-zinc-500">
                {formatearFecha(i.fecha)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className="text-sm font-mono text-emerald-400">$</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={i.monto}
                  onBlur={(e) => {
                    const valor = Number(e.target.value);
                    if (Number.isFinite(valor) && valor !== Number(i.monto)) {
                      handleEditar(i.id, 'monto', valor);
                    }
                  }}
                  className="w-20 bg-transparent text-sm font-mono tabular-nums text-emerald-400 text-right border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all"
                />
              </div>
              <ConfirmButton onConfirm={() => handleEliminar(i.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
