'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/session';

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    return { error: 'El servidor no tiene configurada la contraseña (APP_PASSWORD).' };
  }

  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Ingresa la contraseña.' };
  }

  // Comparación en tiempo constante para evitar timing attacks básicos.
  const valid = timingSafeEqual(password, appPassword);

  if (!valid) {
    return { error: 'Contraseña incorrecta.' };
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
