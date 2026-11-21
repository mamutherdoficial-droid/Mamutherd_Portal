-- =====================================================================
-- Fase 5 · Producto para otros gerentes (lo que no depende de decisiones de negocio).
-- 1. crear_empresa: una cuenta crea su empresa y queda como gerente (máximo 3 por cuenta).
-- 2. exportaciones: registro de cada exportación de datos personales (Ley 1581, SEGURIDAD.md).
-- El registro público se abre o cierra en la app (REGISTRO_ABIERTO, D-042).
-- Se puede correr dos veces sin error.
-- =====================================================================

-- ---------- 1. Crear empresa ------------------------------------------
create or replace function public.crear_empresa(p_nombre text, p_mi_nombre text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  yo     uuid := auth.uid();
  nombre text := btrim(coalesce(p_nombre, ''));
  quien  text := btrim(coalesce(p_mi_nombre, ''));
  base   text;
  v_slug text;
  n      int := 1;
  e      uuid;
begin
  if yo is null then
    raise exception 'Primero crea tu cuenta o entra' using errcode = '42501';
  end if;
  if length(nombre) < 2 or length(nombre) > 80 then
    raise exception 'Escribe el nombre del negocio (de 2 a 80 letras)' using errcode = '22023';
  end if;
  if length(quien) < 2 or length(quien) > 120 then
    raise exception 'Escribe tu nombre' using errcode = '22023';
  end if;
  -- Freno contra abusos: cada cuenta crea máximo 3 empresas.
  if (select count(*) from public.miembros m where m.usuario_id = yo and m.rol = 'gerente') >= 3 then
    raise exception 'Ya tienes 3 empresas. Escríbenos si necesitas más.' using errcode = '22023';
  end if;

  base := trim(both '-' from regexp_replace(lower(translate(nombre,
            'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunaeiouun')), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'empresa'; end if;
  base := left(base, 40);
  v_slug := base;
  while exists (select 1 from public.empresas where empresas.slug = v_slug) loop
    n := n + 1;
    v_slug := base || '-' || n;
  end loop;

  insert into public.empresas (nombre, slug) values (nombre, v_slug) returning id into e;
  insert into public.miembros (empresa_id, usuario_id, nombre, rol, forma_pago)
  values (e, yo, quien, 'gerente', 'ninguno');
  return e;
end $$;

revoke execute on function public.crear_empresa(text, text) from public, anon;
grant execute on function public.crear_empresa(text, text) to authenticated;

-- ---------- 2. Registro de exportaciones -------------------------------
create table if not exists public.exportaciones (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  miembro_id  uuid references public.miembros(id) on delete set null,
  tipo        text not null check (tipo in ('clientes')),
  filas       int not null default 0,
  creado_en   timestamptz not null default now()
);
alter table public.exportaciones enable row level security;
drop policy if exists gerente_todo on public.exportaciones;
create policy gerente_todo on public.exportaciones for all
  using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id));
revoke all on public.exportaciones from anon;
grant select, insert on public.exportaciones to authenticated;
