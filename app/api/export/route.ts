import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  const [semestres, gastosFijos, gastosDiarios, ingresos, presupuestos, aportesCompartidos, gastosCompartidos, colchonAjuste] =
    await Promise.all([
      supabase.from('semestres').select('*'),
      supabase.from('gastos_fijos').select('*'),
      supabase.from('gastos_diarios').select('*'),
      supabase.from('ingresos').select('*'),
      supabase.from('presupuestos').select('*'),
      supabase.from('aportes_compartidos').select('*'),
      supabase.from('gastos_compartidos').select('*'),
      supabase.from('colchon_ajuste').select('*'),
    ]);

  const backup = {
    exportado_en: new Date().toISOString(),
    semestres: semestres.data ?? [],
    gastos_fijos: gastosFijos.data ?? [],
    gastos_diarios: gastosDiarios.data ?? [],
    ingresos: ingresos.data ?? [],
    presupuestos: presupuestos.data ?? [],
    aportes_compartidos: aportesCompartidos.data ?? [],
    gastos_compartidos: gastosCompartidos.data ?? [],
    colchon_ajuste: colchonAjuste.data ?? [],
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-coofisam-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
