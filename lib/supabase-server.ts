import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para uso EXCLUSIVO en el servidor (Server Components,
 * Server Actions, Route Handlers). Usa la service_role key, que tiene acceso
 * total y por eso NUNCA debe llevar el prefijo NEXT_PUBLIC_ ni llegar al bundle
 * del navegador. El import 'server-only' de arriba hace que el build falle si
 * este archivo se importa accidentalmente desde un Client Component.
 *
 * Se instancia de forma perezosa (lazy) para evitar que Next.js falle al
 * recolectar datos de la página en build time si las variables de entorno
 * todavía no están disponibles en ese momento.
 */
let cachedClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.'
    );
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
