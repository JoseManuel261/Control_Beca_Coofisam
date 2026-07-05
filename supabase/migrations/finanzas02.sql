-- =========================================================
-- Módulo de Gestión Financiera Personal
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- Gastos fijos mensuales (arriendo, servicios, internet, etc.)
create table if not exists gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  monto numeric not null check (monto >= 0),
  fecha_vencimiento date not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Pagado')),
  categoria text not null default 'General',
  comprobante_url text,
  anio_mes text not null, -- formato 'YYYY-MM', para filtrar por periodo
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_fijos_anio_mes on gastos_fijos (anio_mes);

-- Gastos diarios / cotidianos
create table if not exists gastos_diarios (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto numeric not null check (monto >= 0),
  categoria text not null default 'Otros',
  fecha date not null default current_date,
  anio_mes text not null, -- formato 'YYYY-MM', derivado de fecha, para filtrar rápido
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_diarios_anio_mes on gastos_diarios (anio_mes);
create index if not exists idx_gastos_diarios_categoria on gastos_diarios (categoria);

-- Presupuestos por categoría y periodo (para las barras de progreso verde -> rojo)
create table if not exists presupuestos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  monto_limite numeric not null check (monto_limite >= 0),
  anio_mes text not null,
  created_at timestamptz not null default now(),
  unique (categoria, anio_mes)
);

-- Ingresos (para que el análisis financiero vea el panorama completo, no solo gastos)
create table if not exists ingresos (
  id uuid primary key default gen_random_uuid(),
  fuente text not null,
  monto numeric not null check (monto >= 0),
  fecha date not null default current_date,
  anio_mes text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ingresos_anio_mes on ingresos (anio_mes);

-- Gastos fijos recurrentes: si marcas uno como recurrente, se re-crea solo
-- cada mes (lo maneja el código en getDatosMes, esta columna solo guarda la intención).
alter table gastos_fijos add column if not exists recurrente boolean not null default false;

-- =========================================================
-- Seguridad adicional: RLS en la tabla original + rate limiting de login
-- =========================================================

-- La tabla `semestres` (módulo Beca) no tenía RLS activado. La app solo la
-- toca con service_role, así que esto es una segunda barrera, no la única.
alter table semestres enable row level security;

-- Registro de intentos de login para bloquear fuerza bruta contra APP_PASSWORD.
-- Funciona server-side vía Server Action, independiente de instancias
-- serverless (a diferencia de un contador en memoria).
create table if not exists login_attempts (
  ip text primary key,
  intentos int not null default 0,
  bloqueado_hasta timestamptz,
  ultimo_intento timestamptz not null default now()
);

alter table login_attempts enable row level security;

-- Esta app accede a Supabase exclusivamente desde el servidor con la
-- service_role key (nunca desde el navegador), la misma arquitectura que ya
-- usamos para "semestres". Por eso NO es obligatorio activar RLS para que la
-- app funcione. Aun así, es buena práctica dejarlo activado sin políticas
-- (deniega todo por defecto) para que, si en algún futuro se usara la anon key
-- en el cliente por error, nadie pueda leer/escribir estas tablas:
-- =========================================================

alter table gastos_fijos enable row level security;
alter table gastos_diarios enable row level security;
alter table presupuestos enable row level security;
alter table ingresos enable row level security;

-- (No se crean policies a propósito: con RLS activado y sin policies,
-- la anon key queda bloqueada por defecto. El service_role key ignora RLS
-- y sigue funcionando con normalidad desde el servidor.)
