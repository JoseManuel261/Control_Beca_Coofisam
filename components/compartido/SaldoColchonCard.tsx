'use client';

import { useState, useTransition } from 'react';
import { PiggyBank, Pencil } from 'lucide-react';
import { actualizarSaldoRealNequi } from '@/app/compartido/actions';
import type { useToasts } from '@/lib/useToasts';

interface SaldoColchonCardProps {
  saldoAcumulado: number;
  saldoRealNequi: number | null;
  netoMes: number;
  toasts: ReturnType<typeof useToasts>;
}

export function SaldoColchonCard({
  saldoAcumulado,
  saldoRealNequi,
  netoMes,
  toasts,
}: SaldoColchonCardProps) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(saldoRealNequi ?? saldoAcumulado);
  const [isPending, startTransition] = useTransition();

  const diferencia = saldoRealNequi !== null ? saldoRealNequi - saldoAcumulado : null;

  const handleGuardar = () => {
    startTransition(async () => {
      try {
        await actualizarSaldoRealNequi(valor);
        toasts.success('Saldo real actualizado.');
        setEditando(false);
      } catch (err) {
        toasts.handleError(err, 'No se pudo guardar.');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
            Colchón acumulado (Nequi)
          </span>
        </div>
        <button
          onClick={() => setEditando((v) => !v)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          title="Anotar el saldo real que ves en Nequi"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="font-fenix text-3xl font-normal text-zinc-100 tabular-nums">
          ${saldoAcumulado.toLocaleString('es-CO')}
        </span>
        <span className={`text-xs font-mono ${netoMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {netoMes >= 0 ? '+' : ''}${netoMes.toLocaleString('es-CO')} este mes
        </span>
      </div>

      {editando ? (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-zinc-500 font-mono">Saldo real en Nequi: $</span>
          <input
            type="number"
            min={0}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className="w-28 bg-zinc-950/60 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-2 py-1 rounded-lg text-xs font-mono text-zinc-300"
          />
          <button
            onClick={handleGuardar}
            disabled={isPending}
            className="text-xs bg-zinc-100 hover:bg-white text-zinc-950 px-3 py-1 rounded-lg font-mono transition-all disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      ) : saldoRealNequi !== null ? (
        <p className="text-[11px] text-zinc-600 font-mono">
          Último saldo real anotado: ${saldoRealNequi.toLocaleString('es-CO')}
          {diferencia !== null && Math.abs(diferencia) > 0 && (
            <span className={diferencia > 0 ? ' text-emerald-500' : ' text-red-400'}>
              {' '}
              ({diferencia > 0 ? '+' : ''}${diferencia.toLocaleString('es-CO')} vs. calculado)
            </span>
          )}
        </p>
      ) : (
        <p className="text-[11px] text-zinc-600 font-mono">
          Toca el lápiz para anotar el saldo real y comparar contra lo calculado aquí.
        </p>
      )}
    </div>
  );
}
