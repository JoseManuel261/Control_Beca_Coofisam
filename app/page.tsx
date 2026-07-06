import { getSupabaseServer } from '@/lib/supabase-server';
import { anioMesDe } from '@/lib/finanzas/categorias';
import { FinanzasClient } from '@/components/finanzas/FinanzasClient';
import type {
  GastoFijo,
  GastoDiario,
  Ingreso,
  Presupuesto,
  MovimientoAhorro,
} from '@/lib/finanzas/types';

export const dynamic = 'force-dynamic';

interface FinanzasPageProps {
  searchParams: Promise<{ mes?: string }>;
}

async function getDatosMes(anioMes: string) {
  const supabase = getSupabaseServer();

  const [fijosRes, diariosRes, ingresosRes, presupuestosRes, ahorrosRes] = await Promise.all([
    supabase.from('gastos_fijos').select('*').eq('anio_mes', anioMes),
    supabase.from('gastos_diarios').select('*').eq('anio_mes', anioMes),
    supabase.from('ingresos').select('*').eq('anio_mes', anioMes),
    supabase.from('presupuestos').select('*').eq('anio_mes', anioMes),
    // Ahorros: SIN filtrar por mes a propósito, es un saldo que se acumula
    // en el tiempo, no algo que se reinicie cada periodo.
    supabase.from('movimientos_ahorro').select('*').order('fecha', { ascending: false }),
  ]);

  if (fijosRes.error) console.error('Error gastos_fijos:', fijosRes.error.message);
  if (diariosRes.error) console.error('Error gastos_diarios:', diariosRes.error.message);
  if (ingresosRes.error) console.error('Error ingresos:', ingresosRes.error.message);
  if (presupuestosRes.error) console.error('Error presupuestos:', presupuestosRes.error.message);
  if (ahorrosRes.error) console.error('Error movimientos_ahorro:', ahorrosRes.error.message);

  return {
    gastosFijos: (fijosRes.data ?? []) as GastoFijo[],
    gastosDiarios: (diariosRes.data ?? []) as GastoDiario[],
    ingresos: (ingresosRes.data ?? []) as Ingreso[],
    presupuestos: (presupuestosRes.data ?? []) as Presupuesto[],
    movimientosAhorro: (ahorrosRes.data ?? []) as MovimientoAhorro[],
  };
}

export default async function FinanzasPage({ searchParams }: FinanzasPageProps) {
  const params = await searchParams;
  const anioMes = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : anioMesDe();

  const { gastosFijos, gastosDiarios, ingresos, presupuestos, movimientosAhorro } =
    await getDatosMes(anioMes);

  return (
    <FinanzasClient
      anioMesInicial={anioMes}
      gastosFijos={gastosFijos}
      gastosDiarios={gastosDiarios}
      ingresos={ingresos}
      presupuestos={presupuestos}
      movimientosAhorro={movimientosAhorro}
    />
  );
}
