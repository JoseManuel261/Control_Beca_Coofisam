export interface AporteCompartido {
  id: string;
  persona: string;
  monto: number;
  concepto: string | null;
  fecha: string; // 'YYYY-MM-DD'
  anio_mes: string; // 'YYYY-MM'
}

export interface GastoCompartido {
  id: string;
  nombre: string;
  monto: number;
  categoria: string;
  fecha_vencimiento: string;
  estado: 'Pendiente' | 'Pagado';
  comprobante_url: string | null;
  anio_mes: string;
  recurrente: boolean;
}

export interface ResumenCompartido {
  anioMes: string;
  aportesMes: AporteCompartido[];
  gastosMes: GastoCompartido[];
  totalAportesMes: number;
  totalGastosMes: number;
  netoMes: number;
  saldoAcumulado: number; // aportes históricos - gastos históricos, de todo el tiempo
  saldoRealNequi: number | null;
}

export const CATEGORIAS_GASTOS_COMPARTIDOS = [
  'Arriendo',
  'Servicios Públicos',
  'Internet',
  'Aseo/Hogar',
  'Otros',
] as const;
