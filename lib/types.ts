export interface Semestre {
  id: string;
  numero_semestre: string;
  anio_periodo: string;
  valor_matricula: number;
  estado_pago: 'Pendiente' | 'Pagado' | 'Por Cursar';
  horas_requeridas: number;
  horas_cumplidas: number;
  certificado_horas_url: string | null;
  notas?: string | null;
}

export interface RangoCoofisam {
  label: string;
  min: number;
  max: number;
  condonacion: number;
}

export const RANGOS_COOFISAM: RangoCoofisam[] = [
  { label: 'Igual o superior a 4.90', min: 4.9, max: 5.0, condonacion: 1.0 },
  { label: 'De 4.60 a 4.89', min: 4.6, max: 4.89, condonacion: 0.9 },
  { label: 'De 4.40 a 4.59', min: 4.4, max: 4.59, condonacion: 0.85 },
  { label: 'De 4.20 a 4.39', min: 4.2, max: 4.39, condonacion: 0.8 },
  { label: 'De 4.00 a 4.19', min: 4.0, max: 4.19, condonacion: 0.7 },
  { label: 'De 3.80 a 3.99', min: 3.8, max: 3.99, condonacion: 0.6 },
  { label: 'De 3.50 a 3.79', min: 3.5, max: 3.79, condonacion: 0.5 },
];

export const HORAS_TOTALES_REQUERIDAS = 360;
