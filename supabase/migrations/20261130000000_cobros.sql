-- =====================================================================
-- Fase 2 · Cobros, mensualidades y comisiones.
-- 1. cerrada_en se llena sola al ganar o perder una venta (meta "clientes nuevos").
-- 2. El motivo de pérdida no puede ser un texto vacío.
-- 3. comisiones.ajustada_en: alerta de comisión pagada sobre un pago anulado.
-- 4. ganar_oportunidad: el asistente "Ganada" en una sola transacción (D-038).
-- Las comisiones las sigue creando solo el trigger generar_comisiones.
-- Se puede correr dos veces sin error.
-- =====================================================================

-- ---------- 1. cerrada_en --------------------------------------------
create or replace function public.marcar_cerrada_en() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Al cerrar: respeta una fecha dada a mano; si no hay, la conserva o pone ahora.
  -- (Una venta abierta siempre tiene cerrada_en null, así que no queda una fecha vieja.)
  if new.etapa in ('ganada', 'perdida') then
    if new.cerrada_en is null then
      new.cerrada_en := coalesce(case when tg_op = 'UPDATE' then old.cerrada_en end, now());
    end if;
  else
    new.cerrada_en := null;  -- se reabrió
  end if;
  return new;
end $$;

drop trigger if exists oportunidades_cerrada_en on public.oportunidades;
create trigger oportunidades_cerrada_en before insert or update of etapa on public.oportunidades
  for each row execute function public.marcar_cerrada_en();

-- Ventas cerradas antes de esta migración: toman su fecha de creación.
update public.oportunidades set cerrada_en = creado_en
 where etapa in ('ganada', 'perdida') and cerrada_en is null;

-- ---------- 2. Motivo de pérdida no vacío -----------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'oportunidades_motivo_no_vacio') then
    alter table public.oportunidades add constraint oportunidades_motivo_no_vacio
      check (etapa <> 'perdida' or btrim(motivo_perdida) <> '');
  end if;
end $$;

-- ---------- 3. Alerta de comisión pagada sobre pago anulado -----------
alter table public.comisiones add column if not exists ajustada_en timestamptz;

-- ---------- 4. Ganar una venta ---------------------------------------
create or replace function public.ganar_oportunidad(
  p_oportunidad      uuid,
  p_plan_instalacion uuid,
  p_valor            int,                 -- precio de la instalación (puede ser el de fundador)
  p_vence            date,
  p_plan_mensual     uuid default null,   -- null = sin mensualidad
  p_precio_mensual   int  default null,   -- null = el precio del plan (se congela)
  p_dia_cobro        int  default 1,
  p_inicia           date default null,   -- null = primer día del mes siguiente
  p_anticipo         int  default null,   -- null o 0 = todavía no pagó
  p_medio            text default 'nequi',
  p_fecha_pago       date default null
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  o        public.oportunidades%rowtype;
  pi       public.planes%rowtype;
  pm       public.planes%rowtype;
  hoy      date := (now() at time zone 'America/Bogota')::date;
  v_cobro  uuid;
  v_susc   uuid;
  v_pago   uuid;
  v_precio int;
begin
  select * into o from public.oportunidades where id = p_oportunidad and borrado_en is null;
  if not found then raise exception 'No encontramos esa venta' using errcode = 'P0002'; end if;
  if not public.es_gerente(o.empresa_id) then
    raise exception 'Solo un gerente puede marcar una venta como ganada' using errcode = '42501';
  end if;
  if o.etapa in ('ganada', 'perdida') then
    raise exception 'Esta venta ya está cerrada' using errcode = '22023';
  end if;

  select * into pi from public.planes
   where id = p_plan_instalacion and empresa_id = o.empresa_id and producto_id = o.producto_id
     and tipo = 'unico' and borrado_en is null;
  if not found then raise exception 'Ese plan de instalación no es de este producto' using errcode = '22023'; end if;
  if p_valor is null or p_valor <= 0 then raise exception 'El valor de la instalación debe ser mayor que cero' using errcode = '22023'; end if;
  if p_anticipo is not null and (p_anticipo < 0 or p_anticipo > p_valor) then
    raise exception 'El anticipo no puede ser mayor que la instalación' using errcode = '22023';
  end if;

  update public.oportunidades
     set etapa = 'ganada', plan_id = pi.id, valor_estimado = p_valor,
         proxima_accion = null, proxima_fecha = null
   where id = o.id;

  insert into public.cobros (empresa_id, cliente_id, oportunidad_id, concepto, descripcion, valor, vence)
  values (o.empresa_id, o.cliente_id, o.id, 'instalacion', pi.nombre, p_valor, coalesce(p_vence, hoy))
  returning id into v_cobro;

  if p_plan_mensual is not null then
    select * into pm from public.planes
     where id = p_plan_mensual and empresa_id = o.empresa_id and producto_id = o.producto_id
       and tipo = 'mensual' and borrado_en is null;
    if not found then raise exception 'Ese plan mensual no es de este producto' using errcode = '22023'; end if;
    v_precio := coalesce(p_precio_mensual, pm.precio);
    if v_precio is null or v_precio < 0 then raise exception 'Falta el precio de la mensualidad' using errcode = '22023'; end if;
    insert into public.suscripciones (empresa_id, cliente_id, plan_id, oportunidad_id, precio_mensual, dia_cobro, inicia)
    values (o.empresa_id, o.cliente_id, pm.id, o.id, v_precio, coalesce(p_dia_cobro, 1),
            coalesce(p_inicia, (date_trunc('month', hoy) + interval '1 month')::date))
    returning id into v_susc;
  end if;

  -- De último: los vendedores ya están, así el trigger crea sus comisiones.
  if coalesce(p_anticipo, 0) > 0 then
    insert into public.pagos (empresa_id, cobro_id, valor, fecha, medio, registrado_por)
    values (o.empresa_id, v_cobro, p_anticipo, coalesce(p_fecha_pago, hoy), coalesce(p_medio, 'nequi'),
            public.mi_miembro(o.empresa_id))
    returning id into v_pago;
  end if;

  return jsonb_build_object('cobro_id', v_cobro, 'suscripcion_id', v_susc, 'pago_id', v_pago,
    'comisiones', (select coalesce(sum(valor), 0) from public.comisiones where pago_id = v_pago));
end $$;

revoke execute on function public.ganar_oportunidad(uuid, uuid, int, date, uuid, int, int, date, int, text, date) from public, anon;
grant execute on function public.ganar_oportunidad(uuid, uuid, int, date, uuid, int, int, date, int, text, date) to authenticated;
revoke execute on function public.marcar_cerrada_en() from public, anon;
