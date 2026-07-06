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
  recurrente: boolean;
}

export interface Ingreso {
  id: string;
  fuente: string;
  monto: number;
  fecha: string;
  anio_mes: string;
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

export interface MovimientoAhorro {
  id: string;
  tipo: 'deposito' | 'retiro';
  monto: number;
  concepto: string | null;
  fecha: string;
  anio_mes: string;
}

export interface ResumenFinanciero {
  anioMes: string;
  totalGastosFijos: number;
  totalGastosDiarios: number;
  totalIngresos: number;
  totalGeneral: number;
  balance: number;
  porCategoria: Record<string, number>;
  presupuestos: Presupuesto[];
  ahorroDelMes: number;
  saldoAhorroAcumulado: number;
}

export interface HistoricoPeriodo {
  anioMes: string;
  totalGastos: number;
  totalIngresos: number;
}
