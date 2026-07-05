export interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  fecha_vencimiento: string; // ISO date (YYYY-MM-DD)
  estado: 'Pendiente' | 'Pagado';
  categoria: string;
  comprobante_url: string | null;
  anio_mes: string; // 'YYYY-MM'
  notas: string | null;
}

export interface GastoDiario {
  id: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string; // ISO date
  anio_mes: string; // 'YYYY-MM'
}

export interface Presupuesto {
  id: string;
  categoria: string;
  monto_limite: number;
  anio_mes: string;
}

export interface ResumenFinanciero {
  anioMes: string;
  totalGastosFijos: number;
  totalGastosDiarios: number;
  totalGeneral: number;
  porCategoria: Record<string, number>;
  presupuestos: Presupuesto[];
}
