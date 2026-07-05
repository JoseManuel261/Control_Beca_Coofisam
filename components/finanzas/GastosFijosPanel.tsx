'use client';

import { useState, useTransition } from 'react';
import { Plus, UploadCloud, FileText, Loader2, Trash2 } from 'lucide-react';
import {
  agregarGastoFijo,
  actualizarEstadoGastoFijo,
  subirComprobante,
  eliminarGastoFijo,
} from '@/app/finanzas/actions';
import { CATEGORIAS_GASTOS_FIJOS } from '@/lib/finanzas/categorias';
import type { GastoFijo } from '@/lib/finanzas/types';
import type { useToasts } from '@/lib/useToasts';

interface GastosFijosPanelProps {
  gastos: GastoFijo[];
  anioMes: string;
  toasts: ReturnType<typeof useToasts>;
}

export function GastosFijosPanel({ gastos, anioMes, toasts }: GastosFijosPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const total = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  const pendiente = gastos
    .filter((g) => g.estado === 'Pendiente')
    .reduce((acc, g) => acc + Number(g.monto), 0);

  const handleAgregar = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      try {
        await agregarGastoFijo(formData);
        toasts.success('Gasto fijo registrado.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el gasto.');
      }
    });
  };

  const handleToggleEstado = (g: GastoFijo) => {
    startTransition(async () => {
      try {
        await actualizarEstadoGastoFijo(g.id, g.estado === 'Pagado' ? 'Pendiente' : 'Pagado');
        toasts.success('Estado actualizado.');
      } catch (err) {
        toasts.error(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
      }
    });
  };

  const handleUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingId(id);

    const formData = new FormData();
    formData.set('file', file);

    try {
      await subirComprobante(id, formData);
      toasts.success('Comprobante subido.');
    } catch (err) {
      toasts.error(err instanceof Error ? err.message : 'No se pudo subir el comprobante.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleEliminar = (id: string) => {
    startTransition(async () => {
      try {
        await eliminarGastoFijo(id);
        toasts.success('Gasto eliminado.');
      } catch (err) {
        toasts.error(err instanceof Error ? err.message : 'No se pudo eliminar.');
      }
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-fenix text-xl text-zinc-300 font-normal">Gastos Fijos</h2>
        <div className="text-right text-xs font-mono text-zinc-500">
          Total: <span className="text-zinc-300">${total.toLocaleString('es-CO')}</span>
          {pendiente > 0 && (
            <span className="text-amber-400 ml-2">
              Pendiente: ${pendiente.toLocaleString('es-CO')}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-900">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider font-medium bg-zinc-900/30">
              <th className="py-3 pl-4 pr-4 font-medium">Nombre</th>
              <th className="py-3 px-4 font-medium">Categoría</th>
              <th className="py-3 px-4 font-medium text-right">Monto</th>
              <th className="py-3 px-4 font-medium">Vence</th>
              <th className="py-3 px-4 font-medium text-center">Estado</th>
              <th className="py-3 pl-4 pr-4 font-medium text-right">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-400">
            {gastos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-600 text-xs font-mono">
                  No hay gastos fijos registrados para este periodo.
                </td>
              </tr>
            )}
            {gastos.map((g) => (
              <tr key={g.id} className="hover:bg-zinc-900/20 transition-colors">
                <td className="py-3 pl-4 pr-4 text-zinc-200">{g.nombre}</td>
                <td className="py-3 px-4 text-xs font-mono text-zinc-500">{g.categoria}</td>
                <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-zinc-300">
                  ${Number(g.monto).toLocaleString('es-CO')}
                </td>
                <td className="py-3 px-4 text-xs font-mono text-zinc-500">
                  {new Date(g.fecha_vencimiento).toLocaleDateString('es-CO')}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleEstado(g)}
                    disabled={isPending}
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border transition-all ${
                      g.estado === 'Pagado'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {g.estado}
                  </button>
                </td>
                <td className="py-3 pl-4 pr-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {g.comprobante_url ? (
                      <button
                        onClick={() => setPreviewUrl(g.comprobante_url)}
                        className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded-lg transition-all font-mono"
                      >
                        <FileText className="w-3 h-3" /> Ver
                      </button>
                    ) : (
                      <label className="cursor-pointer inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-400 text-xs transition-all font-mono">
                        {uploadingId === g.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" /> Subir
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleUpload(g.id, e)}
                          disabled={uploadingId !== null}
                        />
                      </label>
                    )}
                    <button
                      onClick={() => handleEliminar(g.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors"
                      aria-label="Eliminar gasto fijo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={handleAgregar} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end text-xs">
        <div className="space-y-1.5">
          <label className="text-zinc-500 block font-mono">Nombre</label>
          <input
            type="text"
            name="nombre"
            placeholder="Ej: Arriendo"
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-zinc-500 block font-mono">Categoría</label>
          <select
            name="categoria"
            defaultValue={CATEGORIAS_GASTOS_FIJOS[0]}
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 transition-all"
          >
            {CATEGORIAS_GASTOS_FIJOS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-zinc-500 block font-mono">Monto</label>
          <input
            type="number"
            name="monto"
            min={0}
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 font-mono transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-zinc-500 block font-mono">Vence</label>
          <input
            type="date"
            name="fecha_vencimiento"
            defaultValue={`${anioMes}-05`}
            required
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 font-mono transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2 rounded-lg transition-all font-mono h-[38px]"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Añadir
        </button>
        {formError && (
          <p className="col-span-2 md:col-span-5 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
      </form>

      {previewUrl && (
        <div
          className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[80vh] flex items-center justify-center">
            {previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[75vh] rounded-lg border border-zinc-800 bg-white" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Comprobante"
                className="max-w-full max-h-[75vh] object-contain border border-zinc-800 rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
