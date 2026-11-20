-- =====================================================================
-- Fase 1 · Tutorial guiado (docs/DESIGN.md → "Tutorial guiado", D-019).
-- Qué recorridos completó (o saltó) cada usuario, por empresa y versión.
-- Si un recorrido cambia de versión en lib/recorridos.ts, se vuelve a mostrar.
-- Cada quien solo ve y cambia lo suyo. Se puede correr dos veces sin error.
-- =====================================================================

create table if not exists public.recorridos_vistos (
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  recorrido     text not null check (recorrido ~ '^[a-z0-9-]{2,60}$'),
  version       int  not null default 1 check (version > 0),
  saltado       boolean not null default false,
  completado_en timestamptz not null default now(),
  primary key (usuario_id, empresa_id, recorrido)
);

alter table public.recorridos_vistos enable row level security;

drop policy if exists propio on public.recorridos_vistos;
create policy propio on public.recorridos_vistos for all
  using (usuario_id = auth.uid() and public.es_miembro(empresa_id))
  with check (usuario_id = auth.uid() and public.es_miembro(empresa_id));

revoke all on public.recorridos_vistos from anon;
grant select, insert, update, delete on public.recorridos_vistos to authenticated;
