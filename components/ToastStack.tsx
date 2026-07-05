'use client';

import { CheckCircle2, XCircle, X } from 'lucide-react';
import type { Toast } from '@/lib/useToasts';

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-full max-w-xs">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-2xl backdrop-blur-sm toast-enter ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/90 border-red-800/60 text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
          )}
          <p className="text-xs leading-relaxed flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
