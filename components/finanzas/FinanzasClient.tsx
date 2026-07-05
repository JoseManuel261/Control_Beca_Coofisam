'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { MonthPicker } from '@/components/finanzas/MonthPicker';
import { GastosFijosPanel } from '@/components/finanzas/GastosFijosPanel';
import { GastosDiariosPanel } from '@/components/finanzas/GastosDiariosPanel';
import { PresupuestoBar } from '@/components/finanzas/PresupuestoBar';
import { AnalisisIA } from '@/components/finanzas/AnalisisIA';
import { ToastStack } from '@/components/ToastStack';
import { LogoutButton } from '@/components/LogoutButton';
import { useToasts } from '@/lib/useToasts';
import { definirPresupuesto } from '@/app/finanzas/actions';
import { CATEGORIAS_GASTOS_DIARIOS } from '@/lib/finanzas/categorias';
import type { GastoFijo, GastoDiario, Presupuesto, ResumenFinanciero } from '@/lib/finanzas/types';

interface FinanzasClientProps {
  anioMesInicial: string;
  gastosFijos: GastoFijo[];
  gastosDiarios: GastoDiario[];
  presupuestos: Presupuesto[];
}

export function FinanzasClient({
  anioMesInicial,
  gastosFijos,
  gastosDiarios,
  presupuestos,
}: FinanzasClientProps) {
  const router = useRouter();
  const toasts = useToasts();
  const [isPending, startTransition] = useTransition();

  const handleCambiarPeriodo = (nuevoAnioMes: string) => {
    router.push(`/finanzas?mes=${nuevoAnioMes}`);
  };

  const totalFijos = useMemo(
    () => gastosFijos.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosFijos]
  );
  const totalDiarios = useMemo(
    () => gastosDiarios.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosDiarios]
  );

  const porCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const g of gastosDiarios) {
      mapa[g.categoria] = (mapa[g.categoria] ?? 0) + Number(g.monto);
    }
    return mapa;
  }, [gastosDiarios]);

  const resumen: ResumenFinanciero = {
    anioMes: anioMesInicial,
    totalGastosFijos: totalFijos,
    totalGastosDiarios: totalDiarios,
    totalGeneral: totalFijos + totalDiarios,
    porCategoria,
    presupuestos,
  };

  const handleDefinirPresupuesto = (categoria: string, monto: number) => {
    startTransition(async () => {
      try {
        await definirPresupuesto(categoria, monto, anioMesInicial);
        toasts.success(`Presupuesto de ${categoria} actualizado.`);
      } catch (err) {
        toasts.error(err instanceof Error ? err.message : 'No se pudo guardar el presupuesto.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased p-6 md:p-16">
      <div className="max-w-5xl mx-auto space-y-14">
        <header className="border-b border-zinc-900 pb-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-fenix text-4xl font-normal text-zinc-100 tracking-tight">
                Gestión Financiera Personal
              </h1>
              <p className="text-zinc-500 text-sm">
                Control de gastos fijos, gastos diarios y diagnóstico con IA.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Beca
              </Link>
              <LogoutButton />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <MonthPicker anioMes={anioMesInicial} onChange={handleCambiarPeriodo} />
            <div className="text-xs font-mono text-zinc-500">
              Total del periodo:{' '}
              <span className="text-zinc-200">${resumen.totalGeneral.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </header>

        <GastosFijosPanel gastos={gastosFijos} anioMes={anioMesInicial} toasts={toasts} />
        <GastosDiariosPanel gastos={gastosDiarios} toasts={toasts} />

        {/* Presupuestos por categoría */}
        <section className="space-y-3">
          <h2 className="font-fenix text-xl text-zinc-300 font-normal">
            Presupuestos por Categoría
          </h2>
          <div className="rounded-2xl border border-zinc-900 p-4 space-y-1 divide-y divide-zinc-900/50">
            {CATEGORIAS_GASTOS_DIARIOS.map((cat) => {
              const limiteActual = presupuestos.find((p) => p.categoria === cat)?.monto_limite ?? null;
              return (
                <div key={cat} className="pt-1 first:pt-0">
                  <PresupuestoBar
                    categoria={cat}
                    gastado={porCategoria[cat] ?? 0}
                    limite={limiteActual}
                  />
                  <PresupuestoInput
                    disabled={isPending}
                    defaultValue={limiteActual}
                    onGuardar={(monto) => handleDefinirPresupuesto(cat, monto)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <AnalisisIA resumen={resumen} />
      </div>

      <ToastStack toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}

function PresupuestoInput({
  defaultValue,
  disabled,
  onGuardar,
}: {
  defaultValue: number | null;
  disabled: boolean;
  onGuardar: (monto: number) => void;
}) {
  const [valor, setValor] = useState(defaultValue ?? 0);

  return (
    <div className="flex items-center gap-2 pb-2">
      <span className="text-[11px] text-zinc-600 font-mono">Límite mensual:</span>
      <input
        type="number"
        min={0}
        value={valor}
        disabled={disabled}
        onChange={(e) => setValor(Number(e.target.value))}
        onBlur={() => {
          if (valor !== (defaultValue ?? 0) && valor >= 0) onGuardar(valor);
        }}
        className="w-24 bg-transparent border-b border-zinc-800 hover:border-zinc-700 focus:border-zinc-500 focus:outline-none text-[11px] font-mono text-zinc-400 text-right transition-all"
      />
    </div>
  );
}
