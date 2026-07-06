'use client';

import { useState, useTransition } from 'react';
import { PiggyBank, Plus, Loader2, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import {
  agregarMovimientoAhorro,
  eliminarMovimientoAhorro,
  actualizarMovimientoAhorro,
} from '@/app/finanzas/actions';
import type { MovimientoAhorro } from '@/lib/finanzas/types';
import type { useToasts } from '@/lib/useToasts';
import { formatearFecha, hoyISO } from '@/lib/finanzas/fecha';
import { ConfirmButton } from '@/components/finanzas/ConfirmButton';

interface AhorrosPanelProps {
  movimientos: MovimientoAhorro[];
  toasts: ReturnType<typeof useToasts>;
}

export function AhorrosPanel({ movimientos, toasts }: AhorrosPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const saldoAcumulado = movimientos.reduce(
    (acc, m) => acc + (m.tipo === 'deposito' ? Number(m.monto) : -Number(m.monto)),
    0
  );

  const handleAgregar = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await agregarMovimientoAhorro(formData);
        toasts.success('Movimiento de ahorro registrado.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el movimiento.');
      }
    });
  };

  const handleEditar = (id: string, campo: 'monto' | 'concepto', valor: string | number) => {
    startTransition(async () => {
      try {
        await actualizarMovimientoAhorro(id, campo, valor);
        toasts.success('Movimiento actualizado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo actualizar.');
      }
    });
  };

  const handleEliminar = (id: string) => {
    startTransition(async () => {
      try {
        await eliminarMovimientoAhorro(id);
        toasts.success('Movimiento eliminado.');
      } catch (err) {
        toasts.handleError(err, 'No se pudo eliminar.');
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-emerald-400" />
          <h2 className="font-fenix text-xl text-zinc-300 font-normal">Ahorros</h2>
        </div>
        <span className="text-sm font-mono">
          Saldo acumulado:{' '}
          <span className={saldoAcumulado >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            ${saldoAcumulado.toLocaleString('es-CO')}
          </span>
        </span>
      </div>
      <p className="text-xs text-zinc-600">
        Este saldo se acumula en el tiempo, no se reinicia al cambiar de mes.
      </p>

      <form
        action={handleAgregar}
        className="grid grid-cols-2 sm:grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-end text-xs"
      >
        <select
          name="tipo"
          defaultValue="deposito"
          className="bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 transition-all"
        >
          <option value="deposito">Depósito</option>
          <option value="retiro">Retiro</option>
        </select>
        <input
          type="text"
          name="concepto"
          placeholder="Concepto (opcional)"
          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-300 transition-all"
        />
        <input
          type="number"
          name="monto"
          min={0}
          placeholder="$"
          required
          inputMode="numeric"
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
          <p className="col-span-2 sm:col-span-5 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-zinc-900 divide-y divide-zinc-900 max-h-80 overflow-y-auto">
        {movimientos.length === 0 && (
          <p className="py-6 text-center text-zinc-600 text-xs font-mono">
            No hay movimientos de ahorro registrados todavía.
          </p>
        )}
        {movimientos.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-zinc-900/20 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              {m.tipo === 'deposito' ? (
                <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <div className="min-w-0">
                <input
                  type="text"
                  defaultValue={m.concepto ?? ''}
                  placeholder={m.tipo === 'deposito' ? 'Depósito' : 'Retiro'}
                  onBlur={(e) => {
                    const valor = e.target.value.trim();
                    if (valor !== (m.concepto ?? '')) handleEditar(m.id, 'concepto', valor);
                  }}
                  className="w-full bg-transparent text-sm text-zinc-200 border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all truncate"
                />
                <p className="text-xs font-mono text-zinc-500">{formatearFecha(m.fecha)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className={`text-sm font-mono ${m.tipo === 'deposito' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {m.tipo === 'deposito' ? '+' : '−'}$
                </span>
                <input
                  type="number"
                  min={0}
                  defaultValue={m.monto}
                  onBlur={(e) => {
                    const valor = Number(e.target.value);
                    if (Number.isFinite(valor) && valor !== Number(m.monto)) {
                      handleEditar(m.id, 'monto', valor);
                    }
                  }}
                  className={`w-20 bg-transparent text-sm font-mono tabular-nums text-right border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all ${
                    m.tipo === 'deposito' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
              </div>
              <ConfirmButton onConfirm={() => handleEliminar(m.id)} className="text-zinc-700 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
