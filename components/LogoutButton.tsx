import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all font-mono"
      >
        <LogOut className="w-3.5 h-3.5" /> Salir
      </button>
    </form>
  );
}
