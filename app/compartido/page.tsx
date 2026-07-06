import { getSupabaseServer } from '@/lib/supabase-server';
import { anioMesDe } from '@/lib/finanzas/categorias';
import { CompartidoClient } from '@/components/compartido/CompartidoClient';
import type { AporteCompartido, GastoCompartido } from '@/lib/compartido/types';

export const dynamic = 'force-dynamic';

interface CompartidoPageProps {
  searchParams: Promise<{ mes?: string }>;
}

async function getDatos(anioMes: string) {
  const supabase = getSupabaseServer();

  const [aportesMesRes, gastosMesRes, aportesTotalRes, gastosTotalRes, ajusteRes] = await Promise.all([
    supabase.from('aportes_compartidos').select('*').eq('anio_mes', anioMes),
    supabase.from('gastos_compartidos').select('*').eq('anio_mes', anioMes),
    supabase.from('aportes_compartidos').select('monto'),
    supabase.from('gastos_compartidos').select('monto'),
    supabase.from('colchon_ajuste').select('*').eq('id', 'actual').maybeSingle(),
  ]);

  const totalAportesHistorico = (aportesTotalRes.data ?? []).reduce(
    (acc, r) => acc + Number(r.monto),
    0
  );
  const totalGastosHistorico = (gastosTotalRes.data ?? []).reduce(
    (acc, r) => acc + Number(r.monto),
    0
  );

  return {
    aportesMes: (aportesMesRes.data ?? []) as AporteCompartido[],
    gastosMes: (gastosMesRes.data ?? []) as GastoCompartido[],
    saldoAcumulado: totalAportesHistorico - totalGastosHistorico,
    saldoRealNequi: ajusteRes.data?.saldo_real ?? null,
  };
}

export default async function CompartidoPage({ searchParams }: CompartidoPageProps) {
  const params = await searchParams;
  const anioMes = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : anioMesDe();

  const { aportesMes, gastosMes, saldoAcumulado, saldoRealNequi } = await getDatos(anioMes);

  return (
    <CompartidoClient
      anioMesInicial={anioMes}
      aportesMes={aportesMes}
      gastosMes={gastosMes}
      saldoAcumulado={saldoAcumulado}
      saldoRealNequi={saldoRealNequi}
    />
  );
}
