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

export async function actualizarNotas(id: string, notas: string) {
  await assertAuthenticated();

  const { error } = await getSupabaseServer()
    .from('semestres')
    .update({ notas })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function actualizarHoras(id: string, horasCumplidas: number, horasRequeridas: number) {
  await assertAuthenticated();

  if (
    !Number.isFinite(horasCumplidas) ||
    !Number.isFinite(horasRequeridas) ||
    horasCumplidas < 0 ||
    horasRequeridas < 0
  ) {
    throw new Error('Las horas deben ser números válidos y no negativos.');
  }

  const { error } = await getSupabaseServer()
    .from('semestres')
    .update({ horas_cumplidas: horasCumplidas, horas_requeridas: horasRequeridas })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function agregarSemestre(formData: FormData) {
  await assertAuthenticated();

  const nuevoSemestre = {
    numero_semestre: String(formData.get('numero_semestre') ?? ''),
    anio_periodo: String(formData.get('anio_periodo') ?? ''),
    valor_matricula: Number(formData.get('valor_matricula') ?? 0),
    estado_pago: String(formData.get('estado_pago') ?? 'Pendiente'),
    horas_requeridas: Number(formData.get('horas_requeridas') ?? 40),
    horas_cumplidas: 0,
    notas: '',
  };

  if (!nuevoSemestre.numero_semestre) {
    throw new Error('El número de semestre es obligatorio.');
  }

  const { error } = await getSupabaseServer().from('semestres').insert([nuevoSemestre]);
  if (error) throw new Error(error.message);

  revalidatePath('/');
}

export async function subirCertificado(id: string, formData: FormData) {
  await assertAuthenticated();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No se recibió ningún archivo.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await getSupabaseServer().storage
    .from('certificados')
    .upload(fileName, file);

  if (uploadError) throw new Error(uploadError.message);

  const { data } = getSupabaseServer().storage.from('certificados').getPublicUrl(fileName);

  const { error: updateError } = await getSupabaseServer()
    .from('semestres')
    .update({ certificado_horas_url: data.publicUrl })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/');
}
