-- =========================================================
-- Módulo de Finanzas Compartidas (arriendo + servicios con roommate)
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

-- Aportes de cada persona hacia el "colchón" compartido (Nequi).
create table if not exists aportes_compartidos (
  id uuid primary key default gen_random_uuid(),
  persona text not null check (persona in ('yo', 'companera')),
  monto numeric not null check (monto >= 0),
  concepto text,
  fecha date not null default current_date,
  anio_mes text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_aportes_anio_mes on aportes_compartidos (anio_mes);

-- Gastos pagados desde el colchón compartido (arriendo, servicios, etc.)
create table if not exists gastos_compartidos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  monto numeric not null check (monto >= 0),
  fecha_vencimiento date not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Pagado')),
  categoria text not null default 'Otros',
  comprobante_url text,
  anio_mes text not null,
  recurrente boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_compartidos_anio_mes on gastos_compartidos (anio_mes);

-- Saldo real del bolsillo de Nequi, para comparar contra el calculado
-- (aportes - gastos) y detectar si algo no cuadra. Fila única (id='actual').
create table if not exists colchon_ajuste (
  id text primary key default 'actual',
  saldo_real numeric not null default 0,
  actualizado_en timestamptz not null default now()
);

alter table aportes_compartidos enable row level security;
alter table gastos_compartidos enable row level security;
alter table colchon_ajuste enable row level security;

-- =========================================================
-- MIGRACIÓN OPCIONAL: mover Arriendo y Servicios Públicos que ya tenías
-- en `gastos_fijos` (personal) hacia `gastos_compartidos`.
--
-- Revisa los datos antes de correr el DELETE. Ejecuta primero el INSERT,
-- verifica en el Table Editor que se copiaron bien, y SOLO ENTONCES corre
-- el DELETE. Ambas líneas están comentadas a propósito.
-- =========================================================

-- Paso 1: copiar
-- insert into gastos_compartidos (nombre, monto, fecha_vencimiento, estado, categoria, comprobante_url, anio_mes, recurrente)
-- select nombre, monto, fecha_vencimiento, estado, categoria, comprobante_url, anio_mes, recurrente
-- from gastos_fijos
-- where categoria in ('Arriendo', 'Servicios Públicos');

-- Paso 2: borrar de gastos_fijos (SOLO después de verificar el paso 1)
-- delete from gastos_fijos where categoria in ('Arriendo', 'Servicios Públicos');
