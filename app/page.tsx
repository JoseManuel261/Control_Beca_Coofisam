import { getSupabaseServer } from '@/lib/supabase-server';
import type { Semestre } from '@/lib/types';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

async function getSemestres(): Promise<Semestre[]> {
  const { data, error } = await getSupabaseServer().from('semestres').select('*');

  if (error) {
    console.error('Error al obtener semestres:', error.message);
    return [];
  }

  const ordenados = [...(data ?? [])].sort((a, b) => {
    const numA = parseInt(a.numero_semestre) || 0;
    const numB = parseInt(b.numero_semestre) || 0;
    return numA - numB;
  });

  return ordenados as Semestre[];
}

export default async function BecaDashboardPage() {
  const semestres = await getSemestres();
  return <DashboardClient semestresIniciales={semestres} />;
}
