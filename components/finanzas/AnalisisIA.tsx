'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ResumenFinanciero } from '@/lib/finanzas/types';

interface AnalisisIAProps {
  resumen: ResumenFinanciero;
}

export function AnalisisIA({ resumen }: AnalisisIAProps) {
  const [analisis, setAnalisis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalizar = async () => {
    setLoading(true);
    setError(null);
    setAnalisis(null);

    try {
      const res = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumen),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo obtener el análisis.');
      }

      setAnalisis(data.analisis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al analizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="font-fenix text-xl text-zinc-300 font-normal">Análisis con IA</h2>
        </div>
        <button
          onClick={handleAnalizar}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2 rounded-lg transition-all text-xs font-mono"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Analizar con IA
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {analisis && (
        <div className="prose prose-invert prose-sm max-w-none prose-headings:font-fenix prose-headings:font-normal prose-p:text-zinc-400 prose-li:text-zinc-400 prose-strong:text-zinc-200">
          <ReactMarkdown>{analisis}</ReactMarkdown>
        </div>
      )}

      {!analisis && !loading && !error && (
        <p className="text-xs text-zinc-600">
          Presiona el botón para obtener un diagnóstico de tus gastos de{' '}
          <span className="font-mono">{resumen.anioMes}</span> generado por IA.
        </p>
      )}
    </section>
  );
}
