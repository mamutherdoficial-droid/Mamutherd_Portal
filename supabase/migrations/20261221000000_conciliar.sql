-- =====================================================================
-- Fase 4b · Subir extracto y conciliar (D-017). Solo gerente.
-- 1. extractos: cada archivo subido.
-- 2. movimientos_banco: cada ingreso del extracto, con huella única por empresa
--    (subir el mismo archivo dos veces no duplica).
-- 3. confirmar_movimiento: el gerente confirma → se crea el pago (y el trigger crea las
--    comisiones). Nunca se registra un pago sin esa confirmación.
-- Se puede correr dos veces sin error.
-- =====================================================================

create table if not exists public.extractos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas(id) on delete cascade,
  banco       text not null check (banco in ('bancolombia','nequi','otro')),
  archivo     text not null,
  filas       int not null default 0,
  nuevos      int not null default 0,
  subido_por  uuid references public.miembros(id) on delete set null,
  subido_en   timestamptz not null default now()
);

create table if not exists public.movimientos_banco (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  extracto_id  uuid references public.extractos(id) on delete set null,
  banco        text not null check (banco in ('bancolombia','nequi','otro')),
  fecha        date not null,
  descripcion  text not null default '',
  referencia   text,
  valor        int not null check (valor > 0),            -- solo ingresos, en pesos enteros
  huella       text not null,
  estado       text not null default 'propuesto' check (estado in ('propuesto','confirmado','descartado')),
  cobro_id     uuid references public.cobros(id) on delete set null,
  pago_id      uuid references public.pagos(id) on delete set null,
  revisado_por uuid references public.miembros(id) on delete set null,
  revisado_en  timestamptz,
  creado_en    timestamptz not null default now(),
  unique (empresa_id, huella),
  check (estado <> 'confirmado' or pago_id is not null)
);
create index if not exists mov_banco_estado_idx on public.movimientos_banco(empresa_id, estado, fecha);

alter table public.extractos enable row level security;
alter table public.movimientos_banco enable row level security;
drop policy if exists gerente_todo on public.extractos;
drop policy if exists gerente_todo on public.movimientos_banco;
create policy gerente_todo on public.extractos for all
  using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id));
create policy gerente_todo on public.movimientos_banco for all
  using (public.es_gerente(empresa_id)) with check (public.es_gerente(empresa_id));
revoke all on public.extractos, public.movimientos_banco from anon;
grant select, insert, update on public.extractos, public.movimientos_banco to authenticated;

-- Confirmar: crea el pago del cobro elegido y marca el movimiento. Una sola vez.
create or replace function public.confirmar_movimiento(p_movimiento uuid, p_cobro uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  mv    public.movimientos_banco%rowtype;
  c     record;
  v_pago uuid;
begin
  select * into mv from public.movimientos_banco where id = p_movimiento for update;
  if not found then raise exception 'No encontramos ese movimiento' using errcode = 'P0002'; end if;
  if not public.es_gerente(mv.empresa_id) then
    raise exception 'Solo un gerente confirma pagos' using errcode = '42501';
  end if;
  if mv.estado <> 'propuesto' then
    raise exception 'Ese movimiento ya se revisó' using errcode = '22023';
  end if;

  select id, empresa_id, saldo, estado into c from public.v_cobros where id = p_cobro;
  if not found or c.empresa_id <> mv.empresa_id or c.estado in ('anulado', 'pagado') then
    raise exception 'Ese cobro no está pendiente' using errcode = '22023';
  end if;
  if mv.valor > c.saldo then
    raise exception 'El movimiento es mayor que el saldo del cobro' using errcode = '22023';
  end if;

  insert into public.pagos (empresa_id, cobro_id, valor, fecha, medio, referencia, registrado_por)
  values (mv.empresa_id, p_cobro, mv.valor, mv.fecha,
          case mv.banco when 'bancolombia' then 'bancolombia' when 'nequi' then 'nequi' else 'otro' end,
          left(coalesce(mv.referencia, mv.descripcion), 120), public.mi_miembro(mv.empresa_id))
  returning id into v_pago;

  update public.movimientos_banco
     set estado = 'confirmado', cobro_id = p_cobro, pago_id = v_pago,
         revisado_por = public.mi_miembro(mv.empresa_id), revisado_en = now()
   where id = mv.id;
  return v_pago;
end $$;

revoke execute on function public.confirmar_movimiento(uuid, uuid) from public, anon;
grant execute on function public.confirmar_movimiento(uuid, uuid) to authenticated;
