-- =====================================================================
-- Fase 1b · Mapa y ruta del día (llegó después de la Fase 5; ver D-044 a D-047)
-- - Ubicación de los negocios (clientes.lat / lng), tomada con el GPS
--   estando en el negocio, tocando el mapa o pegando un enlace de Maps.
-- - Rutas del día por vendedor, con paradas ordenadas.
-- - Al anotar una visita, la parada pendiente de ese negocio en la ruta
--   de hoy de esa persona se marca sola como visitada.
-- No se guarda la ubicación de las personas del equipo (D-013).
-- Se puede correr dos veces sin error.
-- =====================================================================

-- ---------- Ubicación de los negocios ---------------------------------
alter table public.clientes
  add column if not exists lat              double precision,
  add column if not exists lng              double precision,
  add column if not exists ubicacion_fuente text,
  add column if not exists ubicado_en       timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clientes_coords_chk') then
    -- Las dos o ninguna (ojo: en un CHECK, null pasa; por eso se compara "is null").
    alter table public.clientes add constraint clientes_coords_chk check (
      (lat is null) = (lng is null)
      and (lat is null or (lat between -90 and 90 and lng between -180 and 180)));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clientes_ubicacion_fuente_chk') then
    alter table public.clientes add constraint clientes_ubicacion_fuente_chk check (
      ubicacion_fuente is null or ubicacion_fuente in ('gps','mapa','enlace'));
  end if;
end $$;

create index if not exists clientes_ubicados_idx on public.clientes(empresa_id)
  where lat is not null and borrado_en is null;

-- ---------- Rutas y paradas -------------------------------------------
create table if not exists public.rutas (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  miembro_id   uuid not null references public.miembros(id) on delete cascade, -- quién sale
  fecha        date not null,                         -- día de la salida (hora Bogotá)
  nombre       text not null check (length(nombre) between 2 and 80), -- "Chapinero · Cra 13"
  modo         text not null default 'a_pie' check (modo in ('a_pie','bici','carro')),
  distancia_m  int check (distancia_m >= 0),           -- de la última ruta calculada
  duracion_s   int check (duracion_s >= 0),
  geometria    jsonb,                                  -- GeoJSON LineString calculado (caché)
  creada_en    timestamptz not null default now(),
  borrado_en   timestamptz
);
create index if not exists rutas_miembro_fecha_idx on public.rutas(empresa_id, miembro_id, fecha)
  where borrado_en is null;

create table if not exists public.ruta_paradas (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  ruta_id       uuid not null references public.rutas(id) on delete cascade,
  cliente_id    uuid not null references public.clientes(id) on delete cascade,
  orden         int  not null check (orden >= 1),
  estado        text not null default 'pendiente' check (estado in ('pendiente','visitada','saltada')),
  actividad_id  uuid references public.actividades(id) on delete set null,
  hecha_en      timestamptz,
  creado_en     timestamptz not null default now(),
  unique (ruta_id, cliente_id)
);
create index if not exists ruta_paradas_ruta_idx on public.ruta_paradas(ruta_id, orden);

-- La parada, su ruta y su negocio tienen que ser de la misma empresa.
create or replace function public.validar_parada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.rutas r where r.id = new.ruta_id and r.empresa_id = new.empresa_id)
     or not exists (select 1 from public.clientes c where c.id = new.cliente_id and c.empresa_id = new.empresa_id) then
    raise exception 'La parada, la ruta y el negocio deben ser de la misma empresa' using errcode = '23514';
  end if;
  if new.estado <> 'pendiente' and new.hecha_en is null then new.hecha_en := now(); end if;
  if new.estado = 'pendiente' then new.hecha_en := null; end if;
  return new;
end $$;
drop trigger if exists ruta_paradas_validar on public.ruta_paradas;
create trigger ruta_paradas_validar before insert or update on public.ruta_paradas
  for each row execute function public.validar_parada();
revoke execute on function public.validar_parada() from public;

-- Reordenar todas las paradas de una ruta de una vez (después de "Ordenar
-- por cercanía" o de arrastrar). Recibe los ids en el orden nuevo y debe
-- traerlos todos. security invoker: la RLS decide si puedes tocar la ruta.
create or replace function public.reordenar_ruta(p_ruta uuid, p_paradas uuid[]) returns void
language plpgsql security invoker set search_path = public as $$
declare total int;
begin
  select count(*) into total from public.ruta_paradas where ruta_id = p_ruta;
  if total = 0 then
    raise exception 'Esa ruta no existe o no tiene paradas' using errcode = 'P0002';
  end if;
  if coalesce(array_length(p_paradas, 1), 0) <> total
     or (select count(distinct x) from unnest(p_paradas) x) <> total
     or exists (select 1 from unnest(p_paradas) x
                where not exists (select 1 from public.ruta_paradas p where p.id = x and p.ruta_id = p_ruta)) then
    raise exception 'El orden nuevo debe traer cada parada de la ruta una sola vez' using errcode = '22023';
  end if;
  update public.ruta_paradas p set orden = o.pos
    from unnest(p_paradas) with ordinality as o(id, pos)
   where p.id = o.id and p.ruta_id = p_ruta;
end $$;
revoke execute on function public.reordenar_ruta(uuid, uuid[]) from public, anon;
grant execute on function public.reordenar_ruta(uuid, uuid[]) to authenticated;

-- Anotar una visita marca la parada de hoy de esa persona.
create or replace function public.marcar_parada_visitada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo in ('visita','demo','instalacion') and new.miembro_id is not null then
    update public.ruta_paradas p
       set estado = 'visitada', actividad_id = new.id, hecha_en = new.fecha
      from public.rutas r
     where p.ruta_id = r.id
       and r.empresa_id = new.empresa_id
       and r.miembro_id = new.miembro_id
       and r.borrado_en is null
       and r.fecha = (new.fecha at time zone 'America/Bogota')::date
       and p.cliente_id = new.cliente_id
       and p.estado = 'pendiente';
  end if;
  return new;
end $$;
drop trigger if exists actividades_marcar_parada on public.actividades;
create trigger actividades_marcar_parada after insert on public.actividades
  for each row execute function public.marcar_parada_visitada();
revoke execute on function public.marcar_parada_visitada() from public;

-- Vista para pintar el mapa: paradas con nombre, ubicación y etapa de Sobremesa/Antesala.
create or replace view public.v_ruta_paradas with (security_invoker = true) as
select p.id, p.empresa_id, p.ruta_id, p.orden, p.estado, p.hecha_en,
       c.id as cliente_id, c.nombre_negocio, c.tipo_negocio, c.direccion, c.barrio,
       c.lat, c.lng, c.contacto_whatsapp,
       (select o.etapa from public.oportunidades o
         where o.cliente_id = c.id and o.borrado_en is null
         order by o.creado_en desc limit 1) as etapa,
       (select o.proxima_accion from public.oportunidades o
         where o.cliente_id = c.id and o.borrado_en is null
         order by o.creado_en desc limit 1) as proxima_accion
  from public.ruta_paradas p
  join public.clientes c on c.id = p.cliente_id;

-- ---------- RLS -------------------------------------------------------
alter table public.rutas enable row level security;
alter table public.ruta_paradas enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['rutas','ruta_paradas']) loop
    execute format('drop policy if exists gerente_todo on public.%I', t);
    execute format('drop policy if exists ayudante_lee on public.%I', t);
    execute format('drop policy if exists ayudante_crea on public.%I', t);
    execute format('drop policy if exists ayudante_edita on public.%I', t);
    execute format('drop policy if exists ayudante_quita on public.%I', t);
    execute format('create policy gerente_todo on public.%I for all
                    using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id))', t);
  end loop;
end $$;

-- Ayudante: solo sus rutas. Se "borran" con borrado_en (no hay política de delete).
create policy ayudante_lee on public.rutas for select using (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));
create policy ayudante_crea on public.rutas for insert with check (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));
create policy ayudante_edita on public.rutas for update using (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id))
  with check (public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));

-- Ayudante: paradas de sus rutas, y solo con negocios que ella puede ver
-- (la subconsulta a clientes pasa por la RLS de clientes).
create policy ayudante_lee on public.ruta_paradas for select using (
  public.es_miembro(empresa_id)
  and exists (select 1 from public.rutas r where r.id = ruta_id and r.miembro_id = public.mi_miembro(r.empresa_id)));
create policy ayudante_crea on public.ruta_paradas for insert with check (
  public.es_miembro(empresa_id)
  and exists (select 1 from public.rutas r where r.id = ruta_id and r.miembro_id = public.mi_miembro(r.empresa_id))
  and exists (select 1 from public.clientes c where c.id = cliente_id));
create policy ayudante_edita on public.ruta_paradas for update using (
  public.es_miembro(empresa_id)
  and exists (select 1 from public.rutas r where r.id = ruta_id and r.miembro_id = public.mi_miembro(r.empresa_id)))
  with check (
  public.es_miembro(empresa_id)
  and exists (select 1 from public.rutas r where r.id = ruta_id and r.miembro_id = public.mi_miembro(r.empresa_id))
  and exists (select 1 from public.clientes c where c.id = cliente_id));
-- Quitar una parada de la ruta (es planeación, no historia): solo si sigue pendiente.
create policy ayudante_quita on public.ruta_paradas for delete using (
  public.es_miembro(empresa_id) and estado = 'pendiente'
  and exists (select 1 from public.rutas r where r.id = ruta_id and r.miembro_id = public.mi_miembro(r.empresa_id)));

revoke all on public.rutas, public.ruta_paradas, public.v_ruta_paradas from anon;
grant select, insert, update, delete on public.rutas, public.ruta_paradas to authenticated;
grant select on public.v_ruta_paradas to authenticated;
