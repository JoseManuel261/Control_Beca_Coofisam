# Control de Beca Coofisam

Bitácora privada de control de matrícula, estados de pago y horas de servicio social
para la beca Coofisam. Acceso restringido a un único usuario.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS 4
- Supabase (Postgres + Storage)
- Autenticación single-user con cookie de sesión firmada (JWT / `jose`)

## Arquitectura de seguridad

- **`proxy.ts`** (convención de Next.js 16, reemplaza al antiguo `middleware.ts`)
  intercepta todas las rutas y exige una cookie de sesión válida antes de dejar
  pasar la petición. Sin sesión válida, redirige a `/login`.
- Las credenciales de Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) viven
  **solo en el servidor** (sin prefijo `NEXT_PUBLIC_`), así que nunca llegan al
  navegador ni pueden extraerse del bundle JS.
- `app/page.tsx` es un **Server Component**: obtiene los datos en el servidor y
  solo genera HTML con datos si la sesión ya fue validada por el proxy. Nadie
  puede "raspar" datos sin antes autenticarse.
- Las mutaciones (agregar semestre, editar notas, subir certificado) se hacen con
  **Server Actions**, que también verifican la sesión antes de tocar la base de
  datos.

## Configuración local

1. Copia `.env.local.example` a `.env.local` y completa los valores:

   ```bash
   cp .env.local.example .env.local
   ```

   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: desde Project Settings > API
     en tu proyecto de Supabase. **La service_role key es secreta**, no la
     compartas ni la subas a git.
   - `APP_PASSWORD`: la contraseña con la que vas a entrar al dashboard.
   - `SESSION_SECRET`: un secreto aleatorio largo. Genéralo con:
     ```bash
     openssl rand -base64 48
     ```

2. Instala dependencias y corre en desarrollo:

   ```bash
   npm install
   npm run dev
   ```

3. Abre [http://localhost:3000](http://localhost:3000) — te debe pedir la
   contraseña antes de mostrar cualquier dato.

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. En **Settings > Environment Variables**, agrega las mismas 4 variables de
   `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD`,
   `SESSION_SECRET`).
3. Despliega. El proxy protegerá automáticamente todas las rutas en producción.

### Recomendación adicional en Supabase

Aunque el `service_role` ya evita exponer nada al cliente, es buena práctica
mantener **Row Level Security (RLS) activado** en la tabla `semestres` y en el
bucket `certificados`, para que ninguna llamada con la `anon key` (por ejemplo si
en el futuro se reintroduce un cliente en el navegador) pueda leer o escribir
datos sin pasar por tus políticas.

## Estructura

```
app/
  actions/        Server Actions (auth.ts, semestres.ts)
  login/          Página de login
  page.tsx        Dashboard (Server Component)
components/       Componentes de UI reutilizables (Client Components)
lib/
  session.ts        Firma/verificación de la cookie de sesión (JWT)
  supabase-server.ts Cliente Supabase server-only (service_role, lazy init)
  types.ts           Tipos y constantes de dominio
proxy.ts          Protección de rutas (Next.js 16)
```
