-- =====================================================================
-- Fase 3 · Equipo, tareas y acceso de ayudantes.
-- 1. miembros.correo (para invitar).
-- 2. invitaciones: token de un solo uso, vence en 7 días; en la base solo su hash (D-014).
-- 3. crear_invitacion (gerente) y aceptar_invitacion (la persona invitada, ya con cuenta).
-- 4. Tareas: hecha_en se llena para todos (antes solo para ayudantes) y se limpia al reabrir.
-- Sin service_role. Se puede correr dos veces sin error.
-- =====================================================================

-- ---------- 1. Correo del miembro ------------------------------------
alter table public.miembros add column if not exists correo text;

-- ---------- 2. Invitaciones ------------------------------------------
create table if not exists public.invitaciones (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  miembro_id  uuid not null references public.miembros(id) on delete cascade,
  token_hash  text not null unique,                       -- sha256 del token; el token nunca se guarda
  creado_por  uuid references public.miembros(id) on delete set null,
  vence_en    timestamptz not null default now() + interval '7 days',
  usada_en    timestamptz,
  usada_por   uuid references auth.users(id) on delete set null,
  creado_en   timestamptz not null default now()
);
create index if not exists invitaciones_miembro_idx on public.invitaciones(miembro_id);

alter table public.invitaciones enable row level security;
drop policy if exists gerente_todo on public.invitaciones;
create policy gerente_todo on public.invitaciones for all
  using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id));
revoke all on public.invitaciones from anon;
grant select, insert, update on public.invitaciones to authenticated;

create or replace function public.hash_token(p_token text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;

-- ---------- 3a. Crear invitación (gerente) ----------------------------
-- Devuelve el token en claro UNA vez, para armar el enlace /unirme?token=…
create or replace function public.crear_invitacion(p_miembro uuid) returns text
language plpgsql security invoker set search_path = public as $$
declare
  m     public.miembros%rowtype;
  token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  select * into m from public.miembros where id = p_miembro and borrado_en is null;
  if not found or not public.es_gerente(m.empresa_id) then
    raise exception 'Solo un gerente de esa empresa puede invitar' using errcode = '42501';
  end if;
  if m.usuario_id is not null then
    raise exception 'Esta persona ya tiene acceso al portal' using errcode = '22023';
  end if;
  -- Una invitación viva a la vez: las anteriores sin usar vencen ya.
  update public.invitaciones set vence_en = now()
   where miembro_id = m.id and usada_en is null and vence_en > now();
  insert into public.invitaciones (empresa_id, miembro_id, token_hash, creado_por)
  values (m.empresa_id, m.id, public.hash_token(token), public.mi_miembro(m.empresa_id));
  return token;
end $$;

-- ---------- 3b. Aceptar invitación (la persona invitada) --------------
-- security definer: quien acepta todavía no es miembro y no ve nada por RLS.
-- Valida adentro: sesión, token vigente y sin usar, miembro sin cuenta.
create or replace function public.aceptar_invitacion(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  yo  uuid := auth.uid();
  inv public.invitaciones%rowtype;
  m   public.miembros%rowtype;
  emp text;
begin
  if yo is null then
    raise exception 'Primero crea tu cuenta o entra' using errcode = '42501';
  end if;
  if p_token is null or length(p_token) < 32 then
    raise exception 'Ese enlace de invitación no es válido' using errcode = '22023';
  end if;

  select * into inv from public.invitaciones where token_hash = public.hash_token(p_token) for update;
  if not found then
    raise exception 'Ese enlace de invitación no es válido' using errcode = '22023';
  end if;
  if inv.usada_en is not null then
    raise exception 'Esta invitación ya se usó. Pide una nueva.' using errcode = '22023';
  end if;
  if inv.vence_en <= now() then
    raise exception 'Esta invitación venció. Pide una nueva.' using errcode = '22023';
  end if;

  select * into m from public.miembros where id = inv.miembro_id and empresa_id = inv.empresa_id and borrado_en is null for update;
  if not found or m.usuario_id is not null then
    raise exception 'Esta invitación ya no sirve. Pide una nueva.' using errcode = '22023';
  end if;
  if exists (select 1 from public.miembros where empresa_id = inv.empresa_id and usuario_id = yo) then
    raise exception 'Tu cuenta ya es parte de esta empresa' using errcode = '22023';
  end if;

  update public.miembros set usuario_id = yo where id = m.id;
  update public.invitaciones set usada_en = now(), usada_por = yo where id = inv.id;
  select nombre into emp from public.empresas where id = inv.empresa_id;
  return jsonb_build_object('empresa', emp, 'nombre', m.nombre, 'rol', m.rol);
end $$;

revoke execute on function public.hash_token(text) from public, anon;
revoke execute on function public.crear_invitacion(uuid) from public, anon;
revoke execute on function public.aceptar_invitacion(text) from public, anon;
grant execute on function public.crear_invitacion(uuid) to authenticated;
grant execute on function public.aceptar_invitacion(text) to authenticated;
grant execute on function public.hash_token(text) to authenticated;

-- ---------- 4. Tareas: hecha_en para todos ----------------------------
create or replace function public.proteger_tarea() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_gerente(new.empresa_id) then
    if new.valor_trabajo is distinct from old.valor_trabajo
       or new.trabajo_pagado_en is distinct from old.trabajo_pagado_en
       or new.asignada_a is distinct from old.asignada_a then
      raise exception 'Solo un gerente puede cambiar el valor, el pago o la persona de una tarea' using errcode = '42501';
    end if;
  end if;
  if new.estado = 'hecha' and old.estado <> 'hecha' then
    -- Solo el gerente puede fijar otra fecha; para la ayudante es siempre ahora.
    new.hecha_en := case when public.es_gerente(new.empresa_id) then coalesce(new.hecha_en, now()) else now() end;
  elsif new.estado = 'hecha' and not public.es_gerente(new.empresa_id) then
    new.hecha_en := old.hecha_en;
  elsif new.estado <> 'hecha' then
    new.hecha_en := null;
  end if;
  return new;
end $$;
revoke execute on function public.proteger_tarea() from public;
