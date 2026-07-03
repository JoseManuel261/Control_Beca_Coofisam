'use client';

import { useActionState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { login, type LoginState } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Lock className="w-5 h-5 text-zinc-400" />
          </div>
          <h1 className="text-xl font-medium text-zinc-100">Control de Beca Coofisam</h1>
          <p className="text-sm text-zinc-500">Acceso restringido. Ingresa tu contraseña.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:outline-none px-3 py-2.5 rounded-lg text-zinc-200 transition-all"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white disabled:opacity-60 text-zinc-950 font-medium px-4 py-2.5 rounded-lg transition-all"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
