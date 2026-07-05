/**
 * Utilidades de fecha "local" (sin hora) para evitar el bug clásico de
 * `new Date('2026-07-05')`: JS interpreta ese string como medianoche UTC,
 * así que en Colombia (UTC-5) se muestra como el día anterior. Estas
 * funciones parsean año/mes/día manualmente, sin pasar por UTC.
 */

/** Convierte 'YYYY-MM-DD' a un Date en horario LOCAL (no UTC). */
export function parsearFechaLocal(fechaISO: string): Date {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1);
}

/** Formatea 'YYYY-MM-DD' a texto legible ('5 jul 2026') sin desfase de zona horaria. */
export function formatearFecha(fechaISO: string): string {
  return parsearFechaLocal(fechaISO).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Fecha de hoy como 'YYYY-MM-DD', en horario local. */
export function hoyISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
