import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'beca_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). Configúralo en .env.local'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'owner';
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
