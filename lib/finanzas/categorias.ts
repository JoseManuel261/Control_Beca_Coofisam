export const CATEGORIAS_GASTOS_DIARIOS = [
  'Comida',
  'Transporte',
  'Antojos',
  'Salud',
  'Ocio',
  'Hogar',
  'Otros',
] as const;

export const CATEGORIAS_GASTOS_FIJOS = [
  'Internet',
  'Suscripciones',
  'Seguros',
  'Otros',
] as const;

export type CategoriaGastoDiario = (typeof CATEGORIAS_GASTOS_DIARIOS)[number];
export type CategoriaGastoFijo = (typeof CATEGORIAS_GASTOS_FIJOS)[number];

/** Devuelve el string 'YYYY-MM' correspondiente a una fecha (o hoy si no se pasa). */
export function anioMesDe(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

/** Genera los últimos N periodos 'YYYY-MM' (incluyendo el actual), más recientes primero. */
export function ultimosPeriodos(n = 12): string[] {
  const periodos: string[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const fecha = new Date(base.getFullYear(), base.getMonth() - i, 1);
    periodos.push(anioMesDe(fecha));
  }
  return periodos;
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Convierte 'YYYY-MM' a una etiqueta legible, ej. 'Julio 2026'. */
export function etiquetaPeriodo(anioMes: string): string {
  const [anio, mes] = anioMes.split('-').map(Number);
  const nombre = NOMBRES_MES[(mes ?? 1) - 1] ?? anioMes;
  return `${nombre} ${anio}`;
}
