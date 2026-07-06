'use client';

import { useEffect, useState, useTransition } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { agregarAporte, eliminarAporte, actualizarAporte, obtenerPersonasSugeridas } from '@/app/compartido/actions';
import { formatearFecha, hoyISO } from '@/lib/finanzas/fecha';
import type { AporteCompartido } from '@/lib/compartido/types';
import type { useToasts } from '@/lib/useToasts';
import { ConfirmButton } from '@/components/finanzas/ConfirmButton';

interface AportesPanelProps {
  aportes: AporteCompartido[];
  toasts: ReturnType<typeof useToasts>;
}

export function AportesPanel({ aportes, toasts }: AportesPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<string[]>([]);

  useEffect(() => {
    obtenerPersonasSugeridas().then(setSugerencias).catch(() => {});
  }, []);

  const total = aportes.reduce((acc, a) => acc + Number(a.monto), 0);
  const porPersona = aportes.reduce<Record<string, number>>((acc, a) => {
    acc[a.persona] = (acc[a.persona] ?? 0) + Number(a.monto);
    return acc;
  }, {});

  const handleAgregar = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await agregarAporte(formData);
        toasts.success('Aporte registrado.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el aporte.');
      }
    });
  };

  const handleEditar = (id: string, campo: 'persona' | 'monto' | 'concepto', valor: string | number) => {
    startTransition(async () => {
      try {
        await actualizarAporte(id, campo, valor);
        toasts.success('Aporte actualizado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo actualizar.');
      }
    });
  };

  const handleEliminar = (id: string) => {
    startTransition(async () => {
      try {
        await eliminarAporte(id);
        toasts.success('Aporte eliminado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo eliminar.');
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-fenix text-xl text-zinc-300 font-normal">Aportes</h2>
        <div className="text-xs font-mono text-zinc-500 space-x-3">
          <span>
            Total: <span className="text-emerald-400">${total.toLocaleString('es-CO')}</span>
          </span>
          {Object.entries(porPersona).map(([persona, monto]) => (
            <span key={persona}>
              {persona}: <span className="text-zinc-300">${monto.toLocaleString('es-CO')}</span>
            </span>
          ))}
        </div>
      </div>

      <datalist id="personas-sugeridas">
        {sugerencias.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <form action={handleAgregar} className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_1fr_auto] gap-3 items-end text-xs">
        <input
          type="text"
          name="persona"
          list="personas-sugeridas"
          placeholder="¿Quién aporta?"
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
        <input
          type="text"
          name="concepto"
          placeholder="Concepto (opcional)"
          className="col-span-2 sm:col-span-1 w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 transition-all"
        />
        <button
          type="submit"
          disabled={isPending}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2.5 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        {formError && (
          <p className="col-span-2 sm:col-span-5 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-zinc-900 divide-y divide-zinc-900">
        {aportes.length === 0 && (
          <p className="py-6 text-center text-zinc-600 text-xs font-mono">
            No hay aportes registrados en este periodo.
          </p>
        )}
        {aportes.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-900/20 transition-colors group">
            <div className="min-w-0 flex-1">
              <input
                type="text"
                list="personas-sugeridas"
                defaultValue={a.persona}
                onBlur={(e) => {
                  const valor = e.target.value.trim();
                  if (valor && valor !== a.persona) handleEditar(a.id, 'persona', valor);
                }}
                className="w-full bg-transparent text-sm text-zinc-200 border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all"
              />
              <p className="text-xs font-mono text-zinc-500">
                {formatearFecha(a.fecha)}
                {a.concepto ? ` · ${a.concepto}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className="text-sm font-mono text-emerald-400">$</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={a.monto}
                  onBlur={(e) => {
                    const valor = Number(e.target.value);
                    if (Number.isFinite(valor) && valor !== Number(a.monto)) {
                      handleEditar(a.id, 'monto', valor);
                    }
                  }}
                  className="w-20 bg-transparent text-sm font-mono tabular-nums text-emerald-400 text-right border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all"
                />
              </div>
              <ConfirmButton onConfirm={() => handleEliminar(a.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
