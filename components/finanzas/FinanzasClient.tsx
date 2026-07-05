'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Download } from 'lucide-react';
import { MonthPicker } from '@/components/finanzas/MonthPicker';
import { GastosFijosPanel } from '@/components/finanzas/GastosFijosPanel';
import { GastosDiariosPanel } from '@/components/finanzas/GastosDiariosPanel';
import { IngresosPanel } from '@/components/finanzas/IngresosPanel';
import { PresupuestoBar } from '@/components/finanzas/PresupuestoBar';
import { AnalisisIA } from '@/components/finanzas/AnalisisIA';
import { TendenciaChart } from '@/components/finanzas/TendenciaChart';
import { ToastStack } from '@/components/ToastStack';
import { LogoutButton } from '@/components/LogoutButton';
import { useToasts } from '@/lib/useToasts';
import { definirPresupuesto, asegurarRecurrentesDelMes } from '@/app/finanzas/actions';
import { CATEGORIAS_GASTOS_DIARIOS } from '@/lib/finanzas/categorias';
import type {
  GastoFijo,
  GastoDiario,
  Ingreso,
  Presupuesto,
  ResumenFinanciero,
} from '@/lib/finanzas/types';

interface FinanzasClientProps {
  anioMesInicial: string;
  gastosFijos: GastoFijo[];
  gastosDiarios: GastoDiario[];
  ingresos: Ingreso[];
  presupuestos: Presupuesto[];
}

export function FinanzasClient({
  anioMesInicial,
  gastosFijos,
  gastosDiarios,
  ingresos,
  presupuestos,
}: FinanzasClientProps) {
  const router = useRouter();
  const toasts = useToasts();
  const [isPending, startTransition] = useTransition();

  // Si el mes no tiene gastos fijos aún, copia los recurrentes del mes
  // anterior automáticamente (una sola vez al entrar al periodo).
  useEffect(() => {
    if (gastosFijos.length === 0) {
      asegurarRecurrentesDelMes(anioMesInicial).then((creoAlgo) => {
        if (creoAlgo) router.refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anioMesInicial]);

  const handleCambiarPeriodo = (nuevoAnioMes: string) => {
    router.push(`/?mes=${nuevoAnioMes}`);
  };

  const totalFijos = useMemo(
    () => gastosFijos.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosFijos]
  );
  const totalDiarios = useMemo(
    () => gastosDiarios.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosDiarios]
  );
  const totalIngresos = useMemo(
    () => ingresos.reduce((acc, i) => acc + Number(i.monto), 0),
    [ingresos]
  );

  const porCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const g of gastosDiarios) {
      mapa[g.categoria] = (mapa[g.categoria] ?? 0) + Number(g.monto);
    }
    return mapa;
  }, [gastosDiarios]);

  const totalGeneral = totalFijos + totalDiarios;

  const resumen: ResumenFinanciero = {
    anioMes: anioMesInicial,
    totalGastosFijos: totalFijos,
    totalGastosDiarios: totalDiarios,
    totalIngresos,
    totalGeneral,
    balance: totalIngresos - totalGeneral,
    porCategoria,
    presupuestos,
  };

  const handleDefinirPresupuesto = (categoria: string, monto: number) => {
    startTransition(async () => {
      try {
        await definirPresupuesto(categoria, monto, anioMesInicial);
        toasts.success(`Presupuesto de ${categoria} actualizado.`);
      } catch (err) {
        toasts.handleError(err, 'No se pudo guardar el presupuesto.');
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
                Control de gastos fijos, gastos diarios, ingresos y diagnóstico con IA.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/api/export"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
                title="Descargar copia de seguridad en JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/beca"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Beca
              </Link>
              <LogoutButton />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <MonthPicker anioMes={anioMesInicial} onChange={handleCambiarPeriodo} />
            <div className="text-xs font-mono text-zinc-500">
              Ingresos: <span className="text-emerald-400">${totalIngresos.toLocaleString('es-CO')}</span>
              {' · '}
              Gastos: <span className="text-amber-400">${totalGeneral.toLocaleString('es-CO')}</span>
              {' · '}
              Balance:{' '}
              <span className={resumen.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                ${resumen.balance.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="font-fenix text-xl text-zinc-300 font-normal">Tendencia (6 meses)</h2>
          <TendenciaChart />
        </section>

        <IngresosPanel ingresos={ingresos} toasts={toasts} />
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
