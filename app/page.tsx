'use client';

import { useEffect, useState } from 'react';
import { Fenix } from 'next/font/google';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  Award, 
  TrendingUp, 
  Loader2, 
  UploadCloud, 
  FileText, 
  X, 
  Plus, 
  HelpCircle 
} from 'lucide-react';

const fenix = Fenix({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap' 
});

interface Semestre {
  id: string;
  numero_semestre: string;
  anio_periodo: string;
  valor_matricula: number;
  estado_pago: string;
  horas_requeridas: number;
  horas_cumplidas: number;
  certificado_horas_url: string | null;
  notas?: string | null;
}

export default function BecaDashboard() {
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Estado para el Simulador Dinámico de Promedio
  const [promedioSimulado, setPromedioSimulado] = useState<number>(4.5);

  // Formulario para añadir nuevos periodos/semestres
  const [nuevoSemestre, setNuevoSemestre] = useState({
    numero_semestre: '',
    anio_periodo: '',
    valor_matricula: 0,
    estado_pago: 'Pendiente',
    horas_requeridas: 40,
    horas_cumplidas: 0,
    notas: ''
  });

  const rangosCoofisam = [
    { label: "Igual o superior a 4.90", min: 4.90, max: 5.00, condonacion: 1.00 },
    { label: "De 4.60 a 4.89", min: 4.60, max: 4.89, condonacion: 0.90 },
    { label: "De 4.40 a 4.59", min: 4.40, max: 4.59, condonacion: 0.85 },
    { label: "De 4.20 a 4.39", min: 4.20, max: 4.39, condonacion: 0.80 },
    { label: "De 4.00 a 4.19", min: 4.00, max: 4.19, condonacion: 0.70 },
    { label: "De 3.80 a 3.99", min: 3.80, max: 3.99, condonacion: 0.60 },
    { label: "De 3.50 a 3.79", min: 3.50, max: 3.79, condonacion: 0.50 },
  ];

  const fetchSemestres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('semestres')
      .select('*');

    if (!error && data) {
      const ordenados = [...data].sort((a, b) => {
        const numA = parseInt(a.numero_semestre) || 0;
        const numB = parseInt(b.numero_semestre) || 0;
        return numA - numB;
      });
      setSemestres(ordenados);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSemestres();
  }, []);

  // Guardado inteligente de notas enBlur
  const handleUpdateNotas = async (id: string, texto: string) => {
    await supabase
      .from('semestres')
      .update({ notas: texto })
      .eq('id', id);
  };

  // Subir certificado al Storage
  const handleUploadFoto = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingId(id);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificados')
        .getPublicUrl(fileName);

      await supabase
        .from('semestres')
        .update({ certificado_horas_url: publicUrl })
        .eq('id', id);

      fetchSemestres();
    } catch (err) {
      console.error("Error al procesar el archivo:", err);
    } finally {
      setUploadingId(null);
    }
  };

  // Insertar nuevo semestre desde el formulario minimalista
  const handleAgregarSemestre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoSemestre.numero_semestre) return;

    const { error } = await supabase
      .from('semestres')
      .insert([nuevoSemestre]);

    if (!error) {
      setNuevoSemestre({
        numero_semestre: '',
        anio_periodo: '',
        valor_matricula: 0,
        estado_pago: 'Pendiente',
        horas_requeridas: 40,
        horas_cumplidas: 0,
        notas: ''
      });
      fetchSemestres();
    }
  };

  // Cálculos matemáticos de agregaciones
  const totalMatricula = semestres.reduce((acc, s) => acc + Number(s.valor_matricula), 0);
  const totalHorasCumplidas = semestres.reduce((acc, s) => acc + (s.horas_cumplidas || 0), 0);
  
  const rangoActivo = rangosCoofisam.find(r => promedioSimulado >= r.min && promedioSimulado <= r.max);
  const porcentajeCondonacion = rangoActivo ? rangoActivo.condonacion : 0;
  const totalARetornar = totalMatricula - (totalMatricula * porcentajeCondonacion);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-2" />
        <p className="text-xs tracking-widest uppercase font-mono">Sincronizando bitácora...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 antialiased selection:bg-zinc-800 selection:text-white p-6 md:p-16">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Encabezado Editorial */}
        <header className="border-b border-zinc-900 pb-10 space-y-3">
          <h1 className={`${fenix.className} text-4xl font-normal text-zinc-100 tracking-tight`}>
            Bitácora de Control: **Beca Coofisam**
          </h1>
          <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
            Registro modular de obligaciones financieras y cumplimiento de horas de servicio social corporativo. Diseñado bajo estructura relacional limpia.
          </p>
        </header>

        {/* Tarjetas KPI de Estado - Enfoque Minimalista Sin Fondos Pesados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Total Financiado</span>
            <div className="flex items-baseline gap-1">
              <span className={`${fenix.className} text-3xl font-normal text-zinc-100 tabular-nums`}>
                ${totalMatricula.toLocaleString('es-CO')}
              </span>
              <span className="text-xs text-zinc-500 font-mono">COP</span>
            </div>
            <p className="text-xs text-zinc-600">Carga acumulada de deuda ante la entidad.</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Servicio Social</span>
            <div className="flex items-baseline gap-1">
              <span className={`${fenix.className} text-3xl font-normal text-zinc-100 tabular-nums`}>
                {totalHorasCumplidas}
              </span>
              <span className="text-sm text-zinc-500 font-normal">/ 360 horas</span>
            </div>
            <p className="text-xs text-zinc-600">Progreso global verificado en territorio.</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium block">Copago Obligatorio Proyectado</span>
            <div className="flex items-baseline gap-1">
              <span className={`${fenix.className} text-3xl font-normal tracking-tight ${totalARetornar > 0 ? 'text-amber-500' : 'text-zinc-100'} tabular-nums`}>
                ${totalARetornar.toLocaleString('es-CO')}
              </span>
            </div>
            <p className="text-xs text-zinc-600">Monto neto de retorno según simulación académica.</p>
          </div>
        </div>

        {/* Tabla Principal: Historial de Cursada */}
        <section className="space-y-4">
          <h2 className={`${fenix.className} text-xl text-zinc-300 font-normal`}>Historial de Periodos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs uppercase tracking-wider font-medium">
                  <th className="py-4 pr-4 font-medium">Semestre</th>
                  <th className="py-4 px-4 font-medium">Periodo</th>
                  <th className="py-4 px-4 font-medium text-right">Valor Matrícula</th>
                  <th className="py-4 px-4 font-medium text-center">Estado</th>
                  <th className="py-4 px-4 font-medium text-center">Horas Cumplidas</th>
                  <th className="py-4 px-4 font-medium">Notas / Observaciones</th>
                  <th className="py-4 pl-4 font-medium text-right">Soporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-400">
                {semestres.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/10 transition-colors group">
                    <td className="py-4 pr-4 font-medium text-zinc-200">{s.numero_semestre}</td>
                    <td className="py-4 px-4 text-xs font-mono text-zinc-500">{s.anio_periodo}</td>
                    <td className="py-4 px-4 text-right font-mono text-xs tabular-nums text-zinc-300">
                      ${Number(s.valor_matricula).toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-mono ${
                        s.estado_pago === 'Pagado' ? 'text-zinc-400 font-bold' : 'text-zinc-600'
                      }`}>
                        {s.estado_pago}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-xs tabular-nums">
                      {s.horas_cumplidas} / {s.horas_requeridas}
                    </td>
                    <td className="py-2 px-4">
                      <input 
                        type="text"
                        defaultValue={s.notas || ''}
                        placeholder="Añadir nota..."
                        onBlur={(e) => handleUpdateNotas(s.id, e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-zinc-900 focus:border-zinc-700 focus:outline-none py-1 text-xs text-zinc-400 placeholder-zinc-700 transition-all"
                      />
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {s.certificado_horas_url ? (
                        <button 
                          onClick={() => setSelectedImage(s.certificado_horas_url)}
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white text-xs border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded transition-all font-mono"
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

        {/* Sección del Simulador y Rangos de Condonación */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-16 pt-4 border-t border-zinc-900">
          
          <div className="space-y-4">
            <h3 className={`${fenix.className} text-xl text-zinc-300 font-normal`}>Proyección</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Arrastra la barra para calibrar tu promedio general proyectado. Las fórmulas internas recalcularán el impacto de copago basándose en los marcos legales de Coofisam.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-400 text-xs font-mono">Promedio General:</span>
                <span className={`${fenix.className} text-3xl font-normal text-amber-500 tracking-tighter font-mono`}>
                  {promedioSimulado.toFixed(2)}
                </span>
              </div>
              <input 
                type="range" 
                min="3.5" 
                max="5.0" 
                step="0.05" 
                value={promedioSimulado} 
                onChange={(e) => setPromedioSimulado(parseFloat(e.target.value))}
                className="w-full accent-zinc-200 h-0.5 bg-zinc-800 cursor-pointer appearance-none outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className={`${fenix.className} text-xl text-zinc-300 font-normal`}>Estructura de Rangos</h3>
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
                  {rangosCoofisam.map((rango, idx) => {
                    const valorAPagar = totalMatricula - (totalMatricula * rango.condonacion);
                    const esActivo = promedioSimulado >= rango.min && promedioSimulado <= rango.max;

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-all ${
                          esActivo ? 'text-zinc-100 font-bold bg-zinc-900/30' : 'opacity-40 hover:opacity-70'
                        }`}
                      >
                        <td className="py-3 px-2">{rango.label}</td>
                        <td className="py-3 px-2">{rango.condonacion * 100}%</td>
                        <td className="py-3 px-2 text-right tabular-nums">
                          {valorAPagar === 0 ? "$ 0" : `$ ${valorAPagar.toLocaleString('es-CO')}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* Formulario de Entrada: Insertar / Modificar Parámetros de Semestre */}
        <section className="border-t border-zinc-900 pt-12 space-y-6">
          <div className="space-y-1">
            <h3 className={`${fenix.className} text-xl text-zinc-300 font-normal`}>Actualizar Parámetros</h3>
            <p className="text-xs text-zinc-500">Inyecta un nuevo registro de semestre o periodo académico al sistema Supabase.</p>
          </div>
          
          <form onSubmit={handleAgregarSemestre} className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end text-xs">
            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Número Semestre</label>
              <input 
                type="text" 
                placeholder="Ej: 6° Semestre"
                value={nuevoSemestre.numero_semestre}
                onChange={(e) => setNuevoSemestre({...nuevoSemestre, numero_semestre: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded text-zinc-300 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Año / Periodo</label>
              <input 
                type="text" 
                placeholder="Ej: 2026-2"
                value={nuevoSemestre.anio_periodo}
                onChange={(e) => setNuevoSemestre({...nuevoSemestre, anio_periodo: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded text-zinc-300 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Valor Matrícula (COP)</label>
              <input 
                type="number" 
                value={nuevoSemestre.valor_matricula || ''}
                onChange={(e) => setNuevoSemestre({...nuevoSemestre, valor_matricula: Number(e.target.value)})}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded text-zinc-300 font-mono transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 block font-mono">Estado Pago</label>
              <select 
                value={nuevoSemestre.estado_pago}
                onChange={(e) => setNuevoSemestre({...nuevoSemestre, estado_pago: e.target.value})}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none p-2 rounded text-zinc-300 transition-all"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Por Cursar">Por Cursar</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-4 flex justify-end pt-2">
              <button 
                type="submit"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-4 py-2 rounded transition-all font-mono"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Periodo
              </button>
            </div>
          </form>
        </section>

      </div>

      {/* Lightbox Flotante Integrado (Modal de Evidencias) */}
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
              className="max-w-full max-h-[75vh] object-contain border border-zinc-800 rounded shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}