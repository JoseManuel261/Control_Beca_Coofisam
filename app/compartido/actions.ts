'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase-server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

async function assertAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);
  if (!valid) throw new Error('No autenticado.');
}

// ---------- Aportes ----------

export async function agregarAporte(formData: FormData) {
  await assertAuthenticated();

  const persona = String(formData.get('persona') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const concepto = String(formData.get('concepto') ?? '').trim() || null;
  const fecha = String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10);

  if (!persona) throw new Error('Indica quién hizo el aporte.');
  if (!Number.isFinite(monto) || monto <= 0) throw new Error('El monto debe ser mayor a 0.');

  const { error } = await getSupabaseServer().from('aportes_compartidos').insert([
    { persona, monto, concepto, fecha, anio_mes: fecha.slice(0, 7) },
  ]);

  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function actualizarAporte(
  id: string,
  campo: 'persona' | 'monto' | 'concepto',
  valor: string | number
) {
  await assertAuthenticated();
  const updates: Record<string, string | number | null> = {};

  if (campo === 'monto') {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) throw new Error('Monto no válido.');
    updates.monto = numero;
  } else if (campo === 'persona') {
    const texto = String(valor).trim();
    if (!texto) throw new Error('El campo no puede quedar vacío.');
    updates.persona = texto;
  } else {
    updates.concepto = String(valor).trim() || null;
  }

  const { error } = await getSupabaseServer().from('aportes_compartidos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function eliminarAporte(id: string) {
  await assertAuthenticated();
  const { error } = await getSupabaseServer().from('aportes_compartidos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function obtenerPersonasSugeridas(): Promise<string[]> {
  await assertAuthenticated();
  const { data } = await getSupabaseServer()
    .from('aportes_compartidos')
    .select('persona')
    .order('created_at', { ascending: false })
    .limit(50);

  const unicos = Array.from(new Set((data ?? []).map((r) => r.persona)));
  return unicos.slice(0, 6);
}

// ---------- Gastos Compartidos ----------

export async function agregarGastoCompartido(formData: FormData) {
  await assertAuthenticated();

  const nombre = String(formData.get('nombre') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const fechaVencimiento = String(formData.get('fecha_vencimiento') ?? '');
  const categoria = String(formData.get('categoria') ?? 'Otros');
  const recurrente = formData.get('recurrente') === 'on';

  if (!nombre) throw new Error('El nombre del gasto es obligatorio.');
  if (!Number.isFinite(monto) || monto < 0) throw new Error('El monto no es válido.');
  if (!fechaVencimiento) throw new Error('La fecha de vencimiento es obligatoria.');

  const MESES_A_GENERAR = 12;
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

  const { error } = await getSupabaseServer().from('gastos_compartidos').insert(registros);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function actualizarEstadoGastoCompartido(id: string, estado: 'Pendiente' | 'Pagado') {
  await assertAuthenticated();
  const { error } = await getSupabaseServer()
    .from('gastos_compartidos')
    .update({ estado })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function actualizarGastoCompartido(
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

  const { error } = await getSupabaseServer().from('gastos_compartidos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

export async function subirComprobanteCompartido(id: string, formData: FormData) {
  await assertAuthenticated();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('No se recibió ningún archivo.');

  const MAX_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_BYTES) throw new Error('El archivo supera el límite de 5MB.');

  const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  if (!extensionesPermitidas.includes(fileExt)) {
    throw new Error('Formato no soportado. Usa imagen (jpg/png/webp) o PDF.');
  }

  const fileName = `compartido-${id}-${Date.now()}.${fileExt}`;
  const supabase = getSupabaseServer();

  const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, file);
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('gastos_compartidos')
    .update({ comprobante_url: data.publicUrl, estado: 'Pagado' })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);
  revalidatePath('/compartido');
}

export async function eliminarGastoCompartido(id: string) {
  await assertAuthenticated();
  const { error } = await getSupabaseServer().from('gastos_compartidos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}

// ---------- Saldo del colchón ----------

export async function actualizarSaldoRealNequi(saldo: number) {
  await assertAuthenticated();
  if (!Number.isFinite(saldo)) throw new Error('Saldo no válido.');

  const { error } = await getSupabaseServer()
    .from('colchon_ajuste')
    .upsert([{ id: 'actual', saldo_real: saldo, actualizado_en: new Date().toISOString() }]);

  if (error) throw new Error(error.message);
  revalidatePath('/compartido');
}
