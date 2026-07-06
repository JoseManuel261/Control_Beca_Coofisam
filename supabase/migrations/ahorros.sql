-- =========================================================
-- Módulo de Ahorros (dentro de Finanzas personal)
-- Ejecutar en Supabase → SQL Editor
-- =========================================================

create table if not exists movimientos_ahorro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('deposito', 'retiro')),
  monto numeric not null check (monto > 0),
  concepto text,
  fecha date not null default current_date,
  anio_mes text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_ahorro_anio_mes on movimientos_ahorro (anio_mes);

alter table movimientos_ahorro enable row level security;
