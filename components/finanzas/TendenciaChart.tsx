'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { obtenerHistorico } from '@/app/finanzas/actions';
import { ultimosPeriodos } from '@/lib/finanzas/categorias';
import type { HistoricoPeriodo } from '@/lib/finanzas/types';

export function TendenciaChart() {
  const [datos, setDatos] = useState<HistoricoPeriodo[] | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerHistorico(ultimosPeriodos(6)).then((res) => {
      if (activo) setDatos(res);
    });
    return () => {
      activo = false;
    };
  }, []);

  if (!datos) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-900 animate-pulse bg-zinc-900/20" />
    );
  }

  const datosFormateados = datos.map((d) => ({
    ...d,
    label: d.anioMes.slice(5) + '/' + d.anioMes.slice(2, 4),
  }));

  return (
    <div className="rounded-2xl border border-zinc-900 p-4">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={datosFormateados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#18181b" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#52525b"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#52525b"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(value) => `$${Number(value ?? 0).toLocaleString('es-CO')}`}
          />
          <Line
            type="monotone"
            dataKey="totalIngresos"
            name="Ingresos"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="totalGastos"
            name="Gastos"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 justify-center text-[11px] font-mono text-zinc-500 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Gastos
        </span>
      </div>
    </div>
  );
}
