'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmButtonProps {
  onConfirm: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Botón de eliminar de dos pasos: el primer clic lo pone en modo "¿Seguro?"
 * por 3 segundos; si se hace clic de nuevo en ese lapso, ejecuta la acción.
 * Evita el diálogo nativo `window.confirm` (rompe la estética) sin dejar de
 * proteger contra clics accidentales.
 */
export function ConfirmButton({ onConfirm, children, className }: ConfirmButtonProps) {
  const [confirmando, setConfirmando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (!confirmando) {
      setConfirmando(true);
      timerRef.current = setTimeout(() => setConfirmando(false), 3000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfirmando(false);
    onConfirm();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        `transition-colors ${
          confirmando
            ? 'text-red-400 animate-pulse'
            : 'text-zinc-700 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100'
        }`
      }
      aria-label={confirmando ? 'Clic de nuevo para confirmar' : 'Eliminar'}
      title={confirmando ? 'Clic de nuevo para confirmar' : 'Eliminar'}
    >
      {children}
    </button>
  );
}
