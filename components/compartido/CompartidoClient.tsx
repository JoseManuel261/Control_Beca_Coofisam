'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, GraduationCap } from 'lucide-react';
import { MonthPicker } from '@/components/finanzas/MonthPicker';
import { LogoutButton } from '@/components/LogoutButton';
import { ToastStack } from '@/components/ToastStack';
import { useToasts } from '@/lib/useToasts';
import { SaldoColchonCard } from '@/components/compartido/SaldoColchonCard';
import { AportesPanel } from '@/components/compartido/AportesPanel';
import { GastosCompartidosPanel } from '@/components/compartido/GastosCompartidosPanel';
import type { AporteCompartido, GastoCompartido } from '@/lib/compartido/types';

interface CompartidoClientProps {
  anioMesInicial: string;
  aportesMes: AporteCompartido[];
  gastosMes: GastoCompartido[];
  saldoAcumulado: number;
  saldoRealNequi: number | null;
}

export function CompartidoClient({
  anioMesInicial,
  aportesMes,
  gastosMes,
  saldoAcumulado,
  saldoRealNequi,
}: CompartidoClientProps) {
  const router = useRouter();
  const toasts = useToasts();

  const handleCambiarPeriodo = (nuevoAnioMes: string) => {
    router.push(`/compartido?mes=${nuevoAnioMes}`);
  };

  const totalAportesMes = useMemo(
    () => aportesMes.reduce((acc, a) => acc + Number(a.monto), 0),
    [aportesMes]
  );
  const totalGastosMes = useMemo(
    () => gastosMes.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosMes]
  );
  const netoMes = totalAportesMes - totalGastosMes;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased p-6 md:p-16">
      <div className="max-w-5xl mx-auto space-y-14">
        <header className="border-b border-zinc-900 pb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-fenix text-3xl sm:text-4xl font-normal text-zinc-100 tracking-tight">
                Finanzas Compartidas
              </h1>
              <p className="text-zinc-500 text-sm">
                Arriendo, servicios y el colchón del apartamento.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
              >
                <Wallet className="w-3.5 h-3.5" /> Finanzas
              </Link>
              <Link
                href="/beca"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Beca
              </Link>
              <LogoutButton />
            </div>
          </div>
          <MonthPicker anioMes={anioMesInicial} onChange={handleCambiarPeriodo} />
        </header>

        <SaldoColchonCard
          saldoAcumulado={saldoAcumulado}
          saldoRealNequi={saldoRealNequi}
          netoMes={netoMes}
          toasts={toasts}
        />

        <AportesPanel aportes={aportesMes} toasts={toasts} />
        <GastosCompartidosPanel gastos={gastosMes} anioMes={anioMesInicial} toasts={toasts} />
      </div>

      <ToastStack toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
