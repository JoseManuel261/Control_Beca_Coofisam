'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase-server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

async function assertAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);
  if (!valid) {
    throw new Error('No autenticado.');
  }
}

// ---------- Gastos Fijos ----------

export async function agregarGastoFijo(formData: FormData) {
  await assertAuthenticated();

  const nombre = String(formData.get('nombre') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const fechaVencimiento = String(formData.get('fecha_vencimiento') ?? '');
  const categoria = String(formData.get('categoria') ?? 'Otros');
  const recurrente = formData.get('recurrente') === 'on';

  if (!nombre) throw new Error('El nombre del gasto es obligatorio.');
  if (!Number.isFinite(monto) || monto < 0) throw new Error('El monto no es válido.');
  if (!fechaVencimiento) throw new Error('La fecha de vencimiento es obligatoria.');

  const MESES_A_GENERAR = 12; // este mes + los siguientes 11
  const [anioBase, mesBase, diaVencimiento] = fechaVencimiento.split('-');
  const cantidadMeses = recurrente ? MESES_A_GENERAR : 1;

  const registros = Array.from({ length: cantidadMeses }, (_, i) => {
    const fecha = new Date(Number(anioBase), Number(mesBase) - 1 + i, 1);
    const anioMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    return {
      nombre,
      monto,
      fecha_vencimiento: `${anioMes}-${diaVencimiento}`,
      categoria,
      estado: 'Pendiente' as const,
      anio_mes: anioMes,
      recurrente,
    };
  });

  const { error } = await getSupabaseServer().from('gastos_fijos').insert(registros);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

/**
 * Si el periodo solicitado no tiene gastos fijos todavía, copia los gastos
 * marcados como recurrentes del periodo inmediatamente anterior (estado
 * "Pendiente", sin comprobante). Se llama automáticamente al abrir un mes.
 */
export async function asegurarRecurrentesDelMes(anioMes: string): Promise<boolean> {
  await assertAuthenticated();
  const supabase = getSupabaseServer();

  const { count } = await supabase
    .from('gastos_fijos')
    .select('id', { count: 'exact', head: true })
    .eq('anio_mes', anioMes);

  if (count && count > 0) return false;

  const [anio, mes] = anioMes.split('-').map(Number);
  const fechaAnterior = new Date(anio, mes - 2, 1);
  const anioMesAnterior = `${fechaAnterior.getFullYear()}-${String(
    fechaAnterior.getMonth() + 1
  ).padStart(2, '0')}`;

  const { data: recurrentes } = await supabase
    .from('gastos_fijos')
    .select('*')
    .eq('anio_mes', anioMesAnterior)
    .eq('recurrente', true);

  if (!recurrentes || recurrentes.length === 0) return false;

  const nuevos = recurrentes.map((g) => {
    const diaVencimiento = g.fecha_vencimiento.split('-')[2] ?? '05';
    return {
      nombre: g.nombre,
      monto: g.monto,
      categoria: g.categoria,
      fecha_vencimiento: `${anioMes}-${diaVencimiento}`,
      estado: 'Pendiente' as const,
      anio_mes: anioMes,
      recurrente: true,
    };
  });

  const { error } = await supabase.from('gastos_fijos').insert(nuevos);
  if (error) {
    console.error('Error al copiar gastos recurrentes:', error.message);
    return false;
  }
  revalidatePath('/');
  return true;
}

export async function actualizarEstadoGastoFijo(id: string, estado: 'Pendiente' | 'Pagado') {
  await assertAuthenticated();

  const { error } = await getSupabaseServer()
    .from('gastos_fijos')
    .update({ estado })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function actualizarGastoFijo(
  id: string,
  campo: 'nombre' | 'monto' | 'categoria' | 'fecha_vencimiento',
  valor: string | number
) {
  await assertAuthenticated();
  const updates: Record<string, string | number> = {};

  if (campo === 'monto') {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) throw new Error('Monto no válido.');
    updates.monto = numero;
  } else {
    const texto = String(valor).trim();
    if (!texto) throw new Error('El campo no puede quedar vacío.');
    updates[campo] = texto;
    if (campo === 'fecha_vencimiento') updates.anio_mes = texto.slice(0, 7);
  }

  const { error } = await getSupabaseServer().from('gastos_fijos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function actualizarGastoDiario(
  id: string,
  campo: 'descripcion' | 'monto' | 'categoria',
  valor: string | number
) {
  await assertAuthenticated();
  const updates: Record<string, string | number> = {};

  if (campo === 'monto') {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) throw new Error('Monto no válido.');
    updates.monto = numero;
  } else {
    const texto = String(valor).trim();
    if (!texto) throw new Error('El campo no puede quedar vacío.');
    updates[campo] = texto;
  }

  const { error } = await getSupabaseServer().from('gastos_diarios').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function actualizarIngreso(
  id: string,
  campo: 'fuente' | 'monto',
  valor: string | number
) {
  await assertAuthenticated();
  const updates: Record<string, string | number> = {};

  if (campo === 'monto') {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) throw new Error('Monto no válido.');
    updates.monto = numero;
  } else {
    const texto = String(valor).trim();
    if (!texto) throw new Error('El campo no puede quedar vacío.');
    updates.fuente = texto;
  }

  const { error } = await getSupabaseServer().from('ingresos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function subirComprobante(id: string, formData: FormData) {
  await assertAuthenticated();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No se recibió ningún archivo.');
  }

  const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  if (!extensionesPermitidas.includes(fileExt)) {
    throw new Error('Formato no soportado. Usa imagen (jpg/png/webp) o PDF.');
  }

  const fileName = `${id}-${Date.now()}.${fileExt}`;
  const supabase = getSupabaseServer();

  const { error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(fileName, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('gastos_fijos')
    .update({ comprobante_url: data.publicUrl, estado: 'Pagado' })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/');
}

export async function eliminarGastoFijo(id: string) {
  await assertAuthenticated();
  const { error } = await getSupabaseServer().from('gastos_fijos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// ---------- Gastos Diarios ----------

export async function agregarGastoDiario(formData: FormData) {
  await assertAuthenticated();

  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const categoria = String(formData.get('categoria') ?? 'Otros');
  const fecha = String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10);

  if (!descripcion) throw new Error('La descripción es obligatoria.');
  if (!Number.isFinite(monto) || monto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const { error } = await getSupabaseServer().from('gastos_diarios').insert([
    {
      descripcion,
      monto,
      categoria,
      fecha,
      anio_mes: fecha.slice(0, 7),
    },
  ]);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function eliminarGastoDiario(id: string) {
  await assertAuthenticated();
  const { error } = await getSupabaseServer().from('gastos_diarios').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// ---------- Presupuestos ----------

export async function definirPresupuesto(categoria: string, montoLimite: number, anioMes: string) {
  await assertAuthenticated();

  if (!Number.isFinite(montoLimite) || montoLimite < 0) {
    throw new Error('El monto límite no es válido.');
  }

  const { error } = await getSupabaseServer()
    .from('presupuestos')
    .upsert(
      [{ categoria, monto_limite: montoLimite, anio_mes: anioMes }],
      { onConflict: 'categoria,anio_mes' }
    );

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// ---------- Ingresos ----------

export async function agregarIngreso(formData: FormData) {
  await assertAuthenticated();

  const fuente = String(formData.get('fuente') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const fecha = String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10);

  if (!fuente) throw new Error('La fuente del ingreso es obligatoria.');
  if (!Number.isFinite(monto) || monto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const { error } = await getSupabaseServer().from('ingresos').insert([
    { fuente, monto, fecha, anio_mes: fecha.slice(0, 7) },
  ]);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function eliminarIngreso(id: string) {
  await assertAuthenticated();
  const { error } = await getSupabaseServer().from('ingresos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// ---------- Histórico (para el gráfico de tendencia) ----------

export async function obtenerHistorico(periodos: string[]) {
  await assertAuthenticated();
  const supabase = getSupabaseServer();

  const [fijosRes, diariosRes, ingresosRes] = await Promise.all([
    supabase.from('gastos_fijos').select('monto, anio_mes').in('anio_mes', periodos),
    supabase.from('gastos_diarios').select('monto, anio_mes').in('anio_mes', periodos),
    supabase.from('ingresos').select('monto, anio_mes').in('anio_mes', periodos),
  ]);

  const totalPorPeriodo = (
    filas: { monto: number; anio_mes: string }[] | null
  ): Record<string, number> => {
    const mapa: Record<string, number> = {};
    for (const fila of filas ?? []) {
      mapa[fila.anio_mes] = (mapa[fila.anio_mes] ?? 0) + Number(fila.monto);
    }
    return mapa;
  };

  const fijosPorMes = totalPorPeriodo(fijosRes.data);
  const diariosPorMes = totalPorPeriodo(diariosRes.data);
  const ingresosPorMes = totalPorPeriodo(ingresosRes.data);

  return periodos
    .slice()
    .reverse()
    .map((anioMes) => ({
      anioMes,
      totalGastos: (fijosPorMes[anioMes] ?? 0) + (diariosPorMes[anioMes] ?? 0),
      totalIngresos: ingresosPorMes[anioMes] ?? 0,
    }));
}
