'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-950/30 border border-red-900/50 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-medium text-zinc-100">Algo salió mal</h1>
          <p className="text-sm text-zinc-500">
            Ocurrió un error inesperado. Puedes intentar de nuevo o volver más tarde.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-zinc-700">Código: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-4 py-2 rounded-lg transition-all text-sm mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reintentar
        </button>
      </div>
    </div>
  );
}
