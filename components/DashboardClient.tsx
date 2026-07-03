'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  DollarSign,
  Award,
  TrendingUp,
  UploadCloud,
  FileText,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  agregarSemestre,
  actualizarNotas,
  actualizarHoras,
  actualizarSemestre,
  subirCertificado,
} from '@/app/actions/semestres';
import { RANGOS_COOFISAM, HORAS_TOTALES_REQUERIDAS, type Semestre } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { LogoutButton } from '@/components/LogoutButton';

interface DashboardClientProps {
  semestresIniciales: Semestre[];
}

const COLOR_ESTADO: Record<string, string> = {
  Pagado: 'text-emerald-400',
  Pendiente: 'text-amber-400',
  'Por Cursar': 'text-zinc-400',
};

export function DashboardClient({ semestresIniciales }: DashboardClientProps) {
  const semestres = semestresIniciales;

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [promedioSimulado, setPromedioSimulado] = useState<number>(4.5);
  const [isAdding, startAddTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const totalMatricula = useMemo(
    () => semestres.reduce((acc, s) => acc + Number(s.valor_matricula), 0),
    [semestres]
  );
  const totalHorasCumplidas = useMemo(
    () => semestres.reduce((acc, s) => acc + (s.horas_cumplidas || 0), 0),
    [semestres]
  );

  const rangoActivo = RANGOS_COOFISAM.find(
    (r) => promedioSimulado >= r.min && promedioSimulado <= r.max
  );
  const porcentajeCondonacion = rangoActivo ? rangoActivo.condonacion : 0;
  const totalARetornar = totalMatricula - totalMatricula * porcentajeCondonacion;

  const handleUpdateNotas = (id: string, texto: string) => {
    startAddTransition(async () => {
      try {
        await actualizarNotas(id, texto);
      } catch (err) {
        console.error('Error al guardar la nota:', err);
      }
    });
  };

  const handleUpdateCampo = (
    id: string,
    campo: 'numero_semestre' | 'anio_periodo' | 'valor_matricula' | 'estado_pago',
    valor: string | number
  ) => {
    startAddTransition(async () => {
      try {
        await actualizarSemestre(id, campo, valor);
      } catch (err) {
        console.error(`Error al guardar ${campo}:`, err);
      }
    });
  };

  const handleUpdateHoras = (id: string, horasCumplidas: number, horasRequeridas: number) => {
    startAddTransition(async () => {
      try {
        await actualizarHoras(id, horasCumplidas, horasRequeridas);
      } catch (err) {
        console.error('Error al guardar las horas:', err);
      }
    });
  };

  const handleUploadFoto = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingId(id);

    const formData = new FormData();
    formData.set('file', file);

    try {
      await subirCertificado(id, formData);
    } catch (err) {
      console.error('Error al subir el certificado:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const handleAgregarSemestre = (formData: FormData) => {
    setFormError(null);
    startAddTransition(async () => {
      try {
        await agregarSemestre(formData);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al registrar el periodo.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased selection:bg-zinc-800 selection:text-white p-6 md:p-16">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Encabezado */}
        <header className="border-b border-zinc-900 pb-10 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="font-fenix text-4xl font-normal text-zinc-100 tracking-tight">
                Bitácora de Control: Beca Coofisam
              </h1>
              <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
                Registro modular de obligaciones financieras y cumplimiento de horas de servicio
                social corporativo.
              </p>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={DollarSign}
            label="Total Financiado"
            value={`$${totalMatricula.toLocaleString('es-CO')}`}
            suffix="COP"
            helper="Carga acumulada de deuda ante la entidad."
          />
          <StatCard
            icon={Award}
            label="Servicio Social"
            value={`${totalHorasCumplidas}`}
            suffix={`/ ${HORAS_TOTALES_REQUERIDAS} horas`}
            helper="Progreso global verificado en territorio."
            accent={totalHorasCumplidas >= HORAS_TOTALES_REQUERIDAS ? 'emerald' : 'default'}
          />
          <StatCard
            icon={TrendingUp}
            label="Copago Obligatorio Proyectado"
            value={`$${totalARetornar.toLocaleString('es-CO')}`}
            helper="Monto neto de retorno según simulación académica."
            accent={totalARetornar > 0 ? 'amber' : 'emerald'}
          />
        </div>

        <div className="space-y-2">
          <ProgressBar value={totalHorasCumplidas} max={HORAS_TOTALES_REQUERIDAS} label="Progreso general de horas" />
        </div>

        {/* Tabla Principal */}
        <section className="space-y-4">
          <h2 className="font-fenix text-xl text-zinc-300 font-normal">Historial de Periodos</h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-900">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider font-medium bg-zinc-900/30">
                  <th className="py-4 pl-4 pr-4 font-medium">Semestre</th>
                  <th className="py-4 px-4 font-medium">Periodo</th>
                  <th className="py-4 px-4 font-medium text-right">Valor Matrícula</th>
                  <th className="py-4 px-4 font-medium text-center">Estado</th>
                  <th className="py-4 px-4 font-medium">Horas</th>
                  <th className="py-4 px-4 font-medium">Notas / Observaciones</th>
                  <th className="py-4 pl-4 pr-4 font-medium text-right">Soporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-400">
                {semestres.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-600 text-xs font-mono">
                      No hay periodos registrados todavía.
                    </td>
                  </tr>
                )}
                {semestres.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/20 transition-colors group">
                    <td className="py-4 pl-4 pr-4 font-medium text-zinc-200">
                      <input
                        type="text"
                        defaultValue={s.numero_semestre}
                        onBlur={(e) => {
                          const valor = e.target.value.trim();
                          if (valor && valor !== s.numero_semestre) {
                            handleUpdateCampo(s.id, 'numero_semestre', valor);
                          }
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all"
                      />
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-zinc-500">
                      <input
                        type="text"
                        defaultValue={s.anio_periodo}
                        onBlur={(e) => {
                          const valor = e.target.value.trim();
                          if (valor !== s.anio_periodo) {
                            handleUpdateCampo(s.id, 'anio_periodo', valor);
                          }
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all font-mono"
                      />
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs tabular-nums text-zinc-300">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-zinc-600">$</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={s.valor_matricula}
                          onBlur={(e) => {
                            const valor = Number(e.target.value);
                            if (Number.isFinite(valor) && valor !== Number(s.valor_matricula)) {
                              handleUpdateCampo(s.id, 'valor_matricula', valor);
                            }
                          }}
                          className="w-24 bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none text-right transition-all"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <select
                        value={s.estado_pago}
                        onChange={(e) =>
                          handleUpdateCampo(s.id, 'estado_pago', e.target.value)
                        }
                        className={`bg-transparent border border-transparent hover:border-zinc-800 rounded-lg px-1.5 py-1 text-xs font-mono font-medium text-center focus:outline-none focus:border-zinc-600 cursor-pointer transition-all ${
                          COLOR_ESTADO[s.estado_pago] ?? 'text-zinc-400'
                        }`}
                      >
                        <option className="bg-zinc-900" value="Pendiente">Pendiente</option>
                        <option className="bg-zinc-900" value="Pagado">Pagado</option>
                        <option className="bg-zinc-900" value="Por Cursar">Por Cursar</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 w-36">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-zinc-300">
                          <input
                            type="number"
                            min={0}
                            defaultValue={s.horas_cumplidas}
                            onBlur={(e) => {
                              const cumplidas = Number(e.target.value);
                              if (Number.isFinite(cumplidas) && cumplidas !== s.horas_cumplidas) {
                                handleUpdateHoras(s.id, cumplidas, s.horas_requeridas);
                              }
                            }}
                            className="w-12 bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none text-right transition-all"
                          />
                          <span className="text-zinc-600">/</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={s.horas_requeridas}
                            onBlur={(e) => {
                              const requeridas = Number(e.target.value);
                              if (Number.isFinite(requeridas) && requeridas !== s.horas_requeridas) {
                                handleUpdateHoras(s.id, s.horas_cumplidas, requeridas);
                              }
                            }}
                            className="w-12 bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none transition-all"
                          />
                        </div>
                        <ProgressBar value={s.horas_cumplidas} max={s.horas_requeridas} compact />
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        defaultValue={s.notas || ''}
                        placeholder="Añadir nota..."
                        onBlur={(e) => handleUpdateNotas(s.id, e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none py-1 text-xs text-zinc-400 placeholder-zinc-700 transition-all"
                      />
                    </td>
                    <td className="py-4 pl-4 pr-4 text-right">
                      {s.certificado_horas_url ? (
                        <button
                          onClick={() => setSelectedImage(s.certificado_horas_url)}
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded-lg transition-all font-mono"
                        >
                          <FileText className="w-3 h-3" /> Ver
                        </button>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-400 text-xs transition-all font-mono">
                          {uploadingId === s.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                          ) : (
                            <>
                              <UploadCloud className="w-3 h-3" /> Subir
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadFoto(s.id, e)}
                            disabled={uploadingId !== null}
                          />
                        </label>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Simulador y Rangos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-16 pt-4 border-t border-zinc-900">
          <div className="space-y-4">
            <h3 className="font-fenix text-xl text-zinc-300 font-normal">Proyección</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Escribe tu promedio exacto o arrastra la barra para calibrarlo. Las fórmulas
              internas recalcularán el impacto de copago basándose en los marcos legales de
              Coofisam.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline gap-3">
                <span className="text-zinc-400 text-xs font-mono">Promedio General:</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.01}
                  value={promedioSimulado}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value);
                    if (Number.isFinite(valor)) setPromedioSimulado(valor);
                  }}
                  className="font-fenix text-3xl font-normal text-amber-500 tracking-tighter tabular-nums bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-amber-600 focus:outline-none text-right w-28 transition-all"
                />
              </div>
              <input
                type="range"
                min="3.5"
                max="5.0"
                step="0.01"
                value={Math.min(5, Math.max(3.5, promedioSimulado))}
                onChange={(e) => setPromedioSimulado(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-full cursor-pointer appearance-none outline-none"
              />
              <p className="text-[11px] text-zinc-600 font-mono">
                La barra cubre el rango de condonación (3.50 – 5.00); el campo de arriba acepta
                cualquier valor exacto.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-fenix text-xl text-zinc-300 font-normal">Estructura de Rangos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-600 uppercase tracking-wider font-medium">
                    <th className="pb-3 font-medium">Intervalo Académico</th>
                    <th className="pb-3 font-medium">Condonación</th>
                    <th className="pb-3 text-right font-medium">Retorno Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-zinc-400">
                  {RANGOS_COOFISAM.map((rango, idx) => {
                    const valorAPagar = totalMatricula - totalMatricula * rango.condonacion;
                    const esActivo = promedioSimulado >= rango.min && promedioSimulado <= rango.max;

                    return (
                      <tr
                        key={idx}
                        className={`transition-all ${
                          esActivo
                            ? 'text-zinc-100 font-bold bg-zinc-900/40 rounded-lg'
                            : 'opacity-40 hover:opacity-70'
                        }`}
                      >
                        <td className="py-3 px-2">{rango.label}</td>
                        <td className="py-3 px-2">{rango.condonacion * 100}%</td>
                        <td className="py-3 px-2 text-right tabular-nums">
                          {valorAPagar === 0 ? '$ 0' : `$ ${valorAPagar.toLocaleString('es-CO')}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Formulario Nuevo Semestre */}
        <section className="border-t border-zinc-900 pt-12 space-y-6">
          <div className="space-y-1">
            <h3 className="font-fenix text-xl text-zinc-300 font-normal">Actualizar Parámetros</h3>
            <p className="text-xs text-zinc-500">
              Inyecta un nuevo registro de semestre o periodo académico al sistema.
            </p>
          </div>

          <form action={handleAgregarSemestre} className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end text-xs">
            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Número Semestre</label>
              <input
                type="text"
                name="numero_semestre"
                placeholder="Ej: 6° Semestre"
                required
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Año / Periodo</label>
              <input
                type="text"
                name="anio_periodo"
                placeholder="Ej: 2026-2"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Valor Matrícula (COP)</label>
              <input
                type="number"
                name="valor_matricula"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 font-mono transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Estado Pago</label>
              <select
                name="estado_pago"
                defaultValue="Pendiente"
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded-lg text-zinc-300 transition-all"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Por Cursar">Por Cursar</option>
              </select>
            </div>

            <input type="hidden" name="horas_requeridas" value={40} />

            {formError && (
              <p className="col-span-2 md:col-span-4 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="col-span-2 md:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={isAdding}
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2 rounded-lg transition-all font-mono"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Registrar Periodo
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[80vh] flex items-center justify-center">
            <button
              className="absolute -top-10 right-0 text-zinc-400 hover:text-white flex items-center gap-1 text-xs font-mono"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-4 h-4" /> Cerrar
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Certificado Soporte"
              className="max-w-full max-h-[75vh] object-contain border border-zinc-800 rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
