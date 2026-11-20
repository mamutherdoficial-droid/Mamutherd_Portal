-- =====================================================================
-- Portal Mamut · esquema base (fases 1 a 4)
-- Reglas: multi-empresa (empresa_id + RLS en todo), dinero en pesos
-- enteros (int), borrado lógico (borrado_en), fechas de negocio en
-- hora de Bogotá. Ver docs/MODELO-DATOS.md y docs/SEGURIDAD.md.
-- Se puede correr dos veces sin error (if not exists / create or replace).
-- =====================================================================

-- ---------- Empresas y miembros --------------------------------------

create table if not exists public.empresas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(nombre) between 2 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  zona_horaria text not null default 'America/Bogota',
  creado_en   timestamptz not null default now(),
  borrado_en  timestamptz
);

create table if not exists public.miembros (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  usuario_id  uuid references auth.users(id) on delete set null, -- null = ayudante sin acceso al portal todavía
  nombre      text not null check (length(nombre) between 2 and 120),
  whatsapp    text,
  rol         text not null check (rol in ('gerente','ayudante')),
  forma_pago  text not null default 'comision' check (forma_pago in ('fijo','comision','por_trabajo','ninguno')),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  borrado_en  timestamptz,
  unique (empresa_id, usuario_id)
);
create index if not exists miembros_usuario_idx on public.miembros(usuario_id);

-- Funciones de permiso. security definer para que las políticas no se
-- llamen a sí mismas sobre miembros (recursión de RLS).
create or replace function public.es_miembro(p_empresa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.miembros m
                 where m.empresa_id = p_empresa and m.usuario_id = auth.uid()
                   and m.activo and m.borrado_en is null);
$$;

create or replace function public.es_gerente(p_empresa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.miembros m
                 where m.empresa_id = p_empresa and m.usuario_id = auth.uid()
                   and m.rol = 'gerente' and m.activo and m.borrado_en is null);
$$;

create or replace function public.mi_miembro(p_empresa uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select m.id from public.miembros m
  where m.empresa_id = p_empresa and m.usuario_id = auth.uid()
    and m.activo and m.borrado_en is null
  limit 1;
$$;

-- ---------- Catálogo: productos y planes -----------------------------

create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  activo      boolean not null default true,
  orden       int not null default 0,
  creado_en   timestamptz not null default now(),
  borrado_en  timestamptz,
  unique (empresa_id, nombre)
);

create table if not exists public.planes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  nombre      text not null,
  tipo        text not null check (tipo in ('unico','mensual')),
  precio      int check (precio >= 0),           -- null = se cotiza
  descripcion text,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  borrado_en  timestamptz,
  unique (producto_id, nombre)
);

-- ---------- Clientes, oportunidades y actividades --------------------

create table if not exists public.clientes (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  nombre_negocio    text not null check (length(nombre_negocio) between 2 and 160),
  tipo_negocio      text,                        -- cafetería, restaurante, hotel, colegio…
  direccion         text,
  barrio            text,
  contacto_nombre   text,
  contacto_whatsapp text,                         -- solo dígitos, con 57 adelante
  instagram         text,
  origen            text not null default 'visita'
                    check (origen in ('visita','conocido','referido','instagram','otro')),
  notas             text,
  creado_por        uuid references public.miembros(id) on delete set null,
  creado_en         timestamptz not null default now(),
  borrado_en        timestamptz
);
create index if not exists clientes_empresa_idx on public.clientes(empresa_id) where borrado_en is null;

create table if not exists public.oportunidades (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  producto_id     uuid not null references public.productos(id),
  plan_id         uuid references public.planes(id),
  etapa           text not null default 'prospecto'
                  check (etapa in ('prospecto','contactado','demo','propuesta','ganada','perdida')),
  valor_estimado  int check (valor_estimado >= 0),
  proxima_accion  text,
  proxima_fecha   date,
  motivo_perdida  text,
  responsable_id  uuid references public.miembros(id) on delete set null, -- quién la mueve hoy
  cerrada_en      timestamptz,
  creado_en       timestamptz not null default now(),
  borrado_en      timestamptz,
  check (etapa <> 'perdida' or motivo_perdida is not null)
);
create index if not exists oport_empresa_etapa_idx on public.oportunidades(empresa_id, etapa) where borrado_en is null;

-- Quién gana comisión por esta oportunidad y en qué proporción.
-- atribucion = cómo se dio la venta (ver acuerdos con ayudantes).
create table if not exists public.oportunidad_vendedores (
  oportunidad_id uuid not null references public.oportunidades(id) on delete cascade,
  miembro_id     uuid not null references public.miembros(id) on delete cascade,
  empresa_id     uuid not null references public.empresas(id) on delete cascade,
  atribucion     text not null check (atribucion in ('propia','conjunta','referido')),
  parte          numeric(5,4) not null default 1 check (parte > 0 and parte <= 1),
  primary key (oportunidad_id, miembro_id)
);

create table if not exists public.actividades (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references public.empresas(id) on delete cascade,
  cliente_id        uuid not null references public.clientes(id) on delete cascade,
  oportunidad_id    uuid references public.oportunidades(id) on delete set null,
  miembro_id        uuid references public.miembros(id) on delete set null,
  tipo              text not null check (tipo in ('visita','whatsapp','llamada','demo','instalacion','otro')),
  hablo_con_dueno   boolean not null default false,
  resultado         text,
  fecha             timestamptz not null default now(),
  creado_en         timestamptz not null default now()
);
create index if not exists act_empresa_fecha_idx on public.actividades(empresa_id, fecha);

-- ---------- Cobros, pagos y mensualidades ----------------------------

create table if not exists public.suscripciones (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  plan_id         uuid not null references public.planes(id),
  oportunidad_id  uuid references public.oportunidades(id) on delete set null,
  precio_mensual  int not null check (precio_mensual >= 0),  -- congelado al firmar (fundadores)
  dia_cobro       int not null default 1 check (dia_cobro between 1 and 28),
  inicia          date not null,
  termina         date,
  estado          text not null default 'activa' check (estado in ('activa','pausada','cancelada')),
  creado_en       timestamptz not null default now()
);

create table if not exists public.cobros (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  oportunidad_id  uuid references public.oportunidades(id) on delete set null,
  suscripcion_id  uuid references public.suscripciones(id) on delete set null,
  concepto        text not null check (concepto in ('instalacion','mensualidad','fotos','piloto','otro')),
  descripcion     text,
  valor           int not null check (valor > 0),
  vence           date not null,
  periodo         date,                          -- mensualidad: primer día del mes que cubre
  anulado_en      timestamptz,
  creado_en       timestamptz not null default now(),
  check (concepto <> 'mensualidad' or (suscripcion_id is not null and periodo is not null))
);
create unique index if not exists cobros_mensualidad_unica
  on public.cobros(suscripcion_id, periodo) where concepto = 'mensualidad' and anulado_en is null;

create table if not exists public.pagos (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  cobro_id        uuid not null references public.cobros(id) on delete cascade,
  valor           int not null check (valor > 0),
  fecha           date not null default (now() at time zone 'America/Bogota')::date,
  medio           text not null default 'nequi' check (medio in ('nequi','bancolombia','efectivo','otro')),
  referencia      text,
  registrado_por  uuid references public.miembros(id) on delete set null,
  anulado_en      timestamptz,
  creado_en       timestamptz not null default now()
);

-- ---------- Comisiones -----------------------------------------------

create table if not exists public.reglas_comision (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  atribucion  text not null check (atribucion in ('propia','conjunta','referido')),
  concepto    text not null check (concepto in ('instalacion','mensualidad','fotos','piloto','otro')),
  porcentaje  numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  meses_max   int check (meses_max > 0),          -- solo mensualidad: cuántos meses paga
  activa      boolean not null default true,
  unique (empresa_id, atribucion, concepto)
);

create table if not exists public.comisiones (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  miembro_id    uuid not null references public.miembros(id) on delete cascade,
  pago_id       uuid not null references public.pagos(id) on delete cascade,
  regla_id      uuid not null references public.reglas_comision(id),
  oportunidad_id uuid not null references public.oportunidades(id) on delete cascade,
  base          int not null,
  porcentaje    numeric(5,2) not null,
  parte         numeric(5,4) not null,
  valor         int not null check (valor >= 0),
  estado        text not null default 'pendiente' check (estado in ('pendiente','pagada','anulada')),
  pagada_en     date,
  medio_pago    text,
  creado_en     timestamptz not null default now(),
  unique (pago_id, miembro_id)
);

-- Cuando entra un pago se generan las comisiones de los vendedores de la
-- oportunidad. Regla de los acuerdos: nadie cobra sobre plata que no entró.
create or replace function public.generar_comisiones() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c   public.cobros%rowtype;
  v_op uuid;
  v   record;
  r   public.reglas_comision%rowtype;
  ya  int;
begin
  select * into c from public.cobros where id = new.cobro_id;
  v_op := coalesce(c.oportunidad_id,
                   (select s.oportunidad_id from public.suscripciones s where s.id = c.suscripcion_id));
  if v_op is null then return new; end if;

  for v in select * from public.oportunidad_vendedores ov where ov.oportunidad_id = v_op loop
    select * into r from public.reglas_comision
      where empresa_id = new.empresa_id and atribucion = v.atribucion
        and concepto = c.concepto and activa;
    if not found then continue; end if;

    if r.meses_max is not null then
      -- cuenta los meses distintos ya comisionados para este vendedor y oportunidad
      select count(distinct co.periodo) into ya
        from public.comisiones k
        join public.pagos p on p.id = k.pago_id
        join public.cobros co on co.id = p.cobro_id
       where k.miembro_id = v.miembro_id and k.oportunidad_id = v_op
         and k.regla_id = r.id and k.estado <> 'anulada'
         and co.periodo is distinct from c.periodo;
      if ya >= r.meses_max then continue; end if;
    end if;

    insert into public.comisiones (empresa_id, miembro_id, pago_id, regla_id, oportunidad_id,
                                   base, porcentaje, parte, valor)
    values (new.empresa_id, v.miembro_id, new.id, r.id, v_op,
            new.valor, r.porcentaje, v.parte,
            floor(new.valor * r.porcentaje / 100 * v.parte)::int)
    on conflict (pago_id, miembro_id) do nothing;
  end loop;
  return new;
end $$;

drop trigger if exists pagos_generan_comisiones on public.pagos;
create trigger pagos_generan_comisiones after insert on public.pagos
  for each row when (new.anulado_en is null) execute function public.generar_comisiones();

-- Si se anula un pago, se anulan sus comisiones pendientes. Las ya pagadas
-- no se tocan: se marcan para revisión en la app (docs/MODELO-DATOS.md).
create or replace function public.anular_comisiones() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.anulado_en is not null and old.anulado_en is null then
    update public.comisiones set estado = 'anulada'
     where pago_id = new.id and estado = 'pendiente';
  end if;
  return new;
end $$;

drop trigger if exists pagos_anulan_comisiones on public.pagos;
create trigger pagos_anulan_comisiones after update of anulado_en on public.pagos
  for each row execute function public.anular_comisiones();

-- ---------- Tareas y trabajos de ayudantes ---------------------------

create table if not exists public.tareas (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  titulo          text not null,
  descripcion     text,
  tipo            text not null default 'general'
                  check (tipo in ('general','seguimiento','fotos','instalacion','diseno')),
  asignada_a      uuid references public.miembros(id) on delete set null,
  cliente_id      uuid references public.clientes(id) on delete set null,
  oportunidad_id  uuid references public.oportunidades(id) on delete set null,
  vence           date,
  estado          text not null default 'pendiente' check (estado in ('pendiente','hecha','cancelada')),
  valor_trabajo   int check (valor_trabajo >= 0),  -- pago por trabajo (ej. sesión de fotos)
  trabajo_pagado_en date,
  hecha_en        timestamptz,
  creado_por      uuid references public.miembros(id) on delete set null,
  creado_en       timestamptz not null default now(),
  borrado_en      timestamptz
);

-- ---------- Inventario (tags NFC, soportes, placas) ------------------

create table if not exists public.inventario_items (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  nombre          text not null,
  unidad          text not null default 'unidad',
  costo_unitario  int check (costo_unitario >= 0),  -- null = por cotizar
  stock_minimo    int not null default 0,
  activo          boolean not null default true,
  unique (empresa_id, nombre)
);

create table if not exists public.inventario_movimientos (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  item_id         uuid not null references public.inventario_items(id) on delete cascade,
  tipo            text not null check (tipo in ('compra','asignacion','instalacion','dano','ajuste')),
  cantidad        int not null check (cantidad <> 0),  -- + entra, − sale
  cliente_id      uuid references public.clientes(id) on delete set null,
  costo_total     int check (costo_total >= 0),
  nota            text,
  fecha           date not null default (now() at time zone 'America/Bogota')::date,
  registrado_por  uuid references public.miembros(id) on delete set null,
  creado_en       timestamptz not null default now(),
  check ((tipo = 'compra' and cantidad > 0) or (tipo in ('asignacion','instalacion','dano') and cantidad < 0) or tipo = 'ajuste')
);

-- ---------- Metas ----------------------------------------------------

create table if not exists public.metas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  semana      date not null check (extract(isodow from semana) = 1), -- lunes
  miembro_id  uuid references public.miembros(id) on delete cascade, -- null = toda la empresa
  producto_id uuid references public.productos(id) on delete cascade, -- null = todos
  indicador   text not null check (indicador in ('visitas','conversaciones_dueno','clientes_nuevos','ingresos')),
  objetivo    int not null check (objetivo >= 0)
);
create unique index if not exists metas_unica on public.metas
  (empresa_id, semana, coalesce(miembro_id, '00000000-0000-0000-0000-000000000000'::uuid),
   coalesce(producto_id, '00000000-0000-0000-0000-000000000000'::uuid), indicador);

-- ---------- Vistas (respetan RLS: security_invoker) ------------------

create or replace view public.v_cobros with (security_invoker = true) as
select c.*,
       coalesce(sum(p.valor) filter (where p.anulado_en is null), 0)::int as pagado,
       (c.valor - coalesce(sum(p.valor) filter (where p.anulado_en is null), 0))::int as saldo,
       case
         when c.anulado_en is not null then 'anulado'
         when coalesce(sum(p.valor) filter (where p.anulado_en is null), 0) >= c.valor then 'pagado'
         when c.vence < (now() at time zone 'America/Bogota')::date then 'vencido'
         when coalesce(sum(p.valor) filter (where p.anulado_en is null), 0) > 0 then 'parcial'
         else 'pendiente'
       end as estado
from public.cobros c
left join public.pagos p on p.cobro_id = c.id
group by c.id;

create or replace view public.v_inventario with (security_invoker = true) as
select i.*, coalesce(sum(m.cantidad), 0)::int as stock,
       coalesce(sum(m.cantidad), 0) <= i.stock_minimo as bajo
from public.inventario_items i
left join public.inventario_movimientos m on m.item_id = i.id
group by i.id;

-- Lo que Mamut les debe a sus ayudantes: comisiones pendientes + trabajos hechos sin pagar.
create or replace view public.v_por_pagar_ayudantes with (security_invoker = true) as
select k.empresa_id, k.miembro_id, 'comision'::text as origen, k.id as origen_id,
       k.valor, k.creado_en::date as desde
from public.comisiones k where k.estado = 'pendiente'
union all
select t.empresa_id, t.asignada_a, 'trabajo', t.id, t.valor_trabajo, t.hecha_en::date
from public.tareas t
where t.estado = 'hecha' and t.valor_trabajo is not null and t.trabajo_pagado_en is null
  and t.asignada_a is not null and t.borrado_en is null;

-- Avance de metas por semana (lunes a domingo, hora de Bogotá).
create or replace view public.v_avance_metas with (security_invoker = true) as
select m.*,
  case m.indicador
    when 'visitas' then (
      select count(*) from public.actividades a
       where a.empresa_id = m.empresa_id and a.tipo = 'visita'
         and (a.fecha at time zone 'America/Bogota')::date between m.semana and m.semana + 6
         and (m.miembro_id is null or a.miembro_id = m.miembro_id))
    when 'conversaciones_dueno' then (
      select count(*) from public.actividades a
       where a.empresa_id = m.empresa_id and a.hablo_con_dueno
         and (a.fecha at time zone 'America/Bogota')::date between m.semana and m.semana + 6
         and (m.miembro_id is null or a.miembro_id = m.miembro_id))
    when 'clientes_nuevos' then (
      select count(*) from public.oportunidades o
       where o.empresa_id = m.empresa_id and o.etapa = 'ganada' and o.borrado_en is null
         and (o.cerrada_en at time zone 'America/Bogota')::date between m.semana and m.semana + 6
         and (m.producto_id is null or o.producto_id = m.producto_id)
         and (m.miembro_id is null or exists (select 1 from public.oportunidad_vendedores ov
                                              where ov.oportunidad_id = o.id and ov.miembro_id = m.miembro_id)))
    when 'ingresos' then (
      select coalesce(sum(p.valor), 0) from public.pagos p
       join public.cobros c on c.id = p.cobro_id
       left join public.oportunidades o on o.id = c.oportunidad_id
       where p.empresa_id = m.empresa_id and p.anulado_en is null
         and p.fecha between m.semana and m.semana + 6
         and (m.producto_id is null or o.producto_id = m.producto_id))
  end::int as logrado
from public.metas m;

-- ---------- Mensualidades del mes ------------------------------------

-- Crea los cobros de mensualidad de un mes para las suscripciones activas.
-- Idempotente: correrla dos veces no duplica (índice cobros_mensualidad_unica).
create or replace function public.generar_mensualidades(p_empresa uuid, p_mes date)
returns int language plpgsql security definer set search_path = public as $$
declare n int; v_mes date := date_trunc('month', p_mes)::date;
begin
  if not public.es_gerente(p_empresa) then
    raise exception 'Solo un gerente puede generar mensualidades' using errcode = '42501';
  end if;
  insert into public.cobros (empresa_id, cliente_id, oportunidad_id, suscripcion_id, concepto,
                             descripcion, valor, vence, periodo)
  select s.empresa_id, s.cliente_id, s.oportunidad_id, s.id, 'mensualidad',
         'Mensualidad ' || to_char(v_mes, 'MM/YYYY'), s.precio_mensual,
         v_mes + (s.dia_cobro - 1), v_mes
  from public.suscripciones s
  where s.empresa_id = p_empresa and s.estado = 'activa' and s.precio_mensual > 0
    and s.inicia <= (v_mes + interval '1 month' - interval '1 day')::date
    and (s.termina is null or s.termina >= v_mes)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.generar_comisiones() from public;
revoke execute on function public.anular_comisiones() from public;
revoke execute on function public.generar_mensualidades(uuid, date) from public, anon;
grant execute on function public.generar_mensualidades(uuid, date) to authenticated;
grant execute on function public.es_miembro(uuid), public.es_gerente(uuid), public.mi_miembro(uuid) to authenticated;

-- ---------- RLS ------------------------------------------------------

alter table public.empresas enable row level security;
alter table public.miembros enable row level security;
alter table public.productos enable row level security;
alter table public.planes enable row level security;
alter table public.clientes enable row level security;
alter table public.oportunidades enable row level security;
alter table public.oportunidad_vendedores enable row level security;
alter table public.actividades enable row level security;
alter table public.suscripciones enable row level security;
alter table public.cobros enable row level security;
alter table public.pagos enable row level security;
alter table public.reglas_comision enable row level security;
alter table public.comisiones enable row level security;
alter table public.tareas enable row level security;
alter table public.inventario_items enable row level security;
alter table public.inventario_movimientos enable row level security;
alter table public.metas enable row level security;

-- Las políticas se recrean para que el archivo se pueda correr dos veces.
do $$
declare t text;
begin
  for t in select unnest(array['empresas','miembros','productos','planes','clientes','oportunidades',
    'oportunidad_vendedores','actividades','suscripciones','cobros','pagos','reglas_comision',
    'comisiones','tareas','inventario_items','inventario_movimientos','metas']) loop
    execute format('drop policy if exists gerente_todo on public.%I', t);
    execute format('drop policy if exists miembro_lee on public.%I', t);
    execute format('drop policy if exists ayudante_lee on public.%I', t);
    execute format('drop policy if exists ayudante_crea on public.%I', t);
    execute format('drop policy if exists ayudante_edita on public.%I', t);
  end loop;
end $$;

-- Empresa: los miembros la ven; solo gerentes la editan. (Crear empresas = fase 5, por RPC.)
create policy miembro_lee on public.empresas for select using (public.es_miembro(id));
create policy gerente_todo on public.empresas for update using (public.es_gerente(id)) with check (public.es_gerente(id));

-- Gerente: todo dentro de su empresa, en todas las tablas con empresa_id.
do $$
declare t text;
begin
  for t in select unnest(array['miembros','productos','planes','clientes','oportunidades',
    'oportunidad_vendedores','actividades','suscripciones','cobros','pagos','reglas_comision',
    'comisiones','tareas','inventario_items','inventario_movimientos','metas']) loop
    execute format('create policy gerente_todo on public.%I for all
                    using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id))', t);
  end loop;
end $$;

-- Ayudante: ve el catálogo, el equipo y las reglas (para saber cuánto gana).
create policy miembro_lee on public.productos for select using (public.es_miembro(empresa_id));
create policy miembro_lee on public.planes for select using (public.es_miembro(empresa_id));
create policy miembro_lee on public.miembros for select using (public.es_miembro(empresa_id));
create policy miembro_lee on public.reglas_comision for select using (public.es_miembro(empresa_id));

-- Ayudante: clientes que creó o en los que es vendedor; puede crear clientes.
create policy ayudante_lee on public.clientes for select using (
  public.es_miembro(empresa_id) and (
    creado_por = public.mi_miembro(empresa_id)
    or exists (select 1 from public.oportunidades o join public.oportunidad_vendedores ov on ov.oportunidad_id = o.id
               where o.cliente_id = clientes.id and ov.miembro_id = public.mi_miembro(clientes.empresa_id))));
create policy ayudante_crea on public.clientes for insert with check (
  public.es_miembro(empresa_id) and creado_por = public.mi_miembro(empresa_id));
create policy ayudante_edita on public.clientes for update using (
  public.es_miembro(empresa_id) and creado_por = public.mi_miembro(empresa_id))
  with check (public.es_miembro(empresa_id) and creado_por = public.mi_miembro(empresa_id));

-- Ayudante: sus oportunidades (responsable o vendedor). Crea solo como responsable.
-- No puede marcar 'ganada': eso lo hace el gerente al recibir el pago (docs/MODELO-DATOS.md).
create policy ayudante_lee on public.oportunidades for select using (
  public.es_miembro(empresa_id) and (
    responsable_id = public.mi_miembro(empresa_id)
    or exists (select 1 from public.oportunidad_vendedores ov
               where ov.oportunidad_id = oportunidades.id and ov.miembro_id = public.mi_miembro(oportunidades.empresa_id))));
create policy ayudante_crea on public.oportunidades for insert with check (
  public.es_miembro(empresa_id) and responsable_id = public.mi_miembro(empresa_id) and etapa <> 'ganada');
create policy ayudante_edita on public.oportunidades for update using (
  public.es_miembro(empresa_id) and responsable_id = public.mi_miembro(empresa_id))
  with check (public.es_miembro(empresa_id) and responsable_id = public.mi_miembro(empresa_id) and etapa <> 'ganada');

create policy ayudante_lee on public.oportunidad_vendedores for select using (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));

-- Ayudante: registra y ve sus actividades.
create policy ayudante_lee on public.actividades for select using (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));
create policy ayudante_crea on public.actividades for insert with check (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));

-- Ayudante: ve solo sus comisiones (no ve cobros, pagos ni suscripciones).
create policy ayudante_lee on public.comisiones for select using (
  public.es_miembro(empresa_id) and miembro_id = public.mi_miembro(empresa_id));

-- Ayudante: ve sus tareas y puede marcarlas hechas.
create policy ayudante_lee on public.tareas for select using (
  public.es_miembro(empresa_id) and asignada_a = public.mi_miembro(empresa_id));
create policy ayudante_edita on public.tareas for update using (
  public.es_miembro(empresa_id) and asignada_a = public.mi_miembro(empresa_id))
  with check (public.es_miembro(empresa_id) and asignada_a = public.mi_miembro(empresa_id));

-- Ayudante: ve sus metas y las de la empresa.
create policy ayudante_lee on public.metas for select using (
  public.es_miembro(empresa_id) and (miembro_id is null or miembro_id = public.mi_miembro(empresa_id)));

-- Columnas que un ayudante no puede cambiar en sus tareas (el valor del trabajo y su pago).
create or replace function public.proteger_tarea() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_gerente(new.empresa_id) then
    if new.valor_trabajo is distinct from old.valor_trabajo
       or new.trabajo_pagado_en is distinct from old.trabajo_pagado_en
       or new.asignada_a is distinct from old.asignada_a then
      raise exception 'Solo un gerente puede cambiar el valor, el pago o la persona de una tarea' using errcode = '42501';
    end if;
    if new.estado = 'hecha' and old.estado <> 'hecha' then new.hecha_en := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists tareas_proteger on public.tareas;
create trigger tareas_proteger before update on public.tareas
  for each row execute function public.proteger_tarea();
revoke execute on function public.proteger_tarea() from public;

-- ---------- Permisos de tabla ----------------------------------------
-- anon no toca nada. authenticated pasa por RLS.
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
