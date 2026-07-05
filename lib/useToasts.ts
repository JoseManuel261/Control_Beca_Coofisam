'use client';

import { useCallback, useRef, useState } from 'react';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let nextId = 1;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type: Toast['type'], message: string, durationMs = 3000) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  /**
   * Muestra el error de una Server Action. Si es "No autenticado." (sesión
   * expirada o cookie inválida), muestra un aviso claro y redirige al login
   * en vez del mensaje genérico.
   */
  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      const mensaje = err instanceof Error ? err.message : fallback;
      if (mensaje === 'No autenticado.') {
        push('error', 'Tu sesión expiró. Redirigiendo al login...', 4000);
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      push('error', mensaje);
    },
    [push]
  );

  return {
    toasts,
    success: useCallback((message: string) => push('success', message), [push]),
    error: useCallback((message: string) => push('error', message), [push]),
    handleError,
    dismiss,
  };
}
