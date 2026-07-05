'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/session';
import { getSupabaseServer } from '@/lib/supabase-server';

export type LoginState = { error?: string } | undefined;

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 10;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return { error: 'El servidor no tiene configurada la contraseña (APP_PASSWORD).' };
  }

  const ip = await getClientIp();
  const supabase = getSupabaseServer();

  // Verificar si esta IP está bloqueada por demasiados intentos fallidos.
  // Si la tabla login_attempts todavía no existe (falta correr el SQL), el
  // rate limiting se omite en vez de romper el login.
  let registro: { intentos: number; bloqueado_hasta: string | null } | null = null;
  try {
    const { data } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('ip', ip)
      .maybeSingle();
    registro = data;
  } catch (err) {
    console.error('Rate limiting no disponible (¿falta correr el SQL de login_attempts?):', err);
  }

  if (registro?.bloqueado_hasta && new Date(registro.bloqueado_hasta) > new Date()) {
    const minutosRestantes = Math.ceil(
      (new Date(registro.bloqueado_hasta).getTime() - Date.now()) / 60000
    );
    return { error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutosRestantes} min.` };
  }

  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Ingresa la contraseña.' };
  }

  const valid = timingSafeEqual(password, appPassword);

  if (!valid) {
    const intentos = (registro?.intentos ?? 0) + 1;
    const bloqueadoHasta =
      intentos >= MAX_INTENTOS
        ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000).toISOString()
        : null;

    try {
      await supabase.from('login_attempts').upsert({
        ip,
        intentos: bloqueadoHasta ? 0 : intentos, // reinicia contador al bloquear
        bloqueado_hasta: bloqueadoHasta,
        ultimo_intento: new Date().toISOString(),
      });
    } catch (err) {
      console.error('No se pudo registrar el intento fallido:', err);
    }

    if (bloqueadoHasta) {
      return { error: `Demasiados intentos fallidos. Intenta de nuevo en ${BLOQUEO_MINUTOS} min.` };
    }
    return { error: 'Contraseña incorrecta.' };
  }

  // Login correcto: limpiar el contador de intentos de esta IP.
  try {
    await supabase.from('login_attempts').delete().eq('ip', ip);
  } catch {
    // No crítico si falla.
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
