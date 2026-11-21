-- =====================================================================
-- Fase 4 · Inventario, metas, Hoy completo y resumen del domingo.
-- 1. guardar_meta: crea o actualiza la meta de una semana (el índice único usa coalesce).
-- 2. resumen_semana: todo lo de la revisión del domingo en una sola consulta (/semana < 1 s).
-- 3. Índices para las lecturas de la semana.
-- security invoker: todo respeta la RLS de quien consulta. Se puede correr dos veces sin error.
-- =====================================================================

-- ---------- 1. Metas --------------------------------------------------
create or replace function public.guardar_meta(
  p_empresa   uuid,
  p_semana    date,
  p_indicador text,
  p_objetivo  int,
  p_miembro   uuid default null,
  p_producto  uuid default null
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if not public.es_gerente(p_empresa) then
    raise exception 'Solo un gerente pone metas' using errcode = '42501';
  end if;
  if extract(isodow from p_semana) <> 1 then
    raise exception 'La semana empieza el lunes' using errcode = '22023';
  end if;
  if p_objetivo is null or p_objetivo < 0 then
    raise exception 'La meta debe ser un número positivo' using errcode = '22023';
  end if;
  insert into public.metas (empresa_id, semana, miembro_id, producto_id, indicador, objetivo)
  values (p_empresa, p_semana, p_miembro, p_producto, p_indicador, p_objetivo)
  on conflict (empresa_id, semana,
               coalesce(miembro_id, '00000000-0000-0000-0000-000000000000'::uuid),
               coalesce(producto_id, '00000000-0000-0000-0000-000000000000'::uuid), indicador)
  do update set objetivo = excluded.objetivo
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.guardar_meta(uuid, date, text, int, uuid, uuid) from public, anon;
grant execute on function public.guardar_meta(uuid, date, text, int, uuid, uuid) to authenticated;

-- ---------- 2. Resumen del domingo -----------------------------------
-- Lo que pide la revisión semanal del plan de ventas, de lunes a domingo (hora de Bogotá).
create or replace function public.resumen_semana(p_empresa uuid, p_lunes date) returns jsonb
language sql stable security invoker set search_path = public as $$
  with rango as (
    select p_lunes as desde, p_lunes + 6 as hasta,
           (p_lunes::timestamp at time zone 'America/Bogota') as t0,
           ((p_lunes + 7)::timestamp at time zone 'America/Bogota') as t1
  )
  select jsonb_build_object(
    'visitas', (select count(*) from public.actividades a, rango r
                 where a.empresa_id = p_empresa and a.tipo = 'visita' and a.fecha >= r.t0 and a.fecha < r.t1),
    'duenos', (select count(*) from public.actividades a, rango r
                where a.empresa_id = p_empresa and a.hablo_con_dueno and a.fecha >= r.t0 and a.fecha < r.t1),
    'clientes_nuevos', (select count(*) from public.oportunidades o, rango r
                         where o.empresa_id = p_empresa and o.etapa = 'ganada' and o.borrado_en is null
                           and o.cerrada_en >= r.t0 and o.cerrada_en < r.t1),
    'ingresos', (select coalesce(sum(p.valor), 0) from public.pagos p, rango r
                  where p.empresa_id = p_empresa and p.anulado_en is null and p.fecha between r.desde and r.hasta),
    'perdidas', (select count(*) from public.oportunidades o, rango r
                  where o.empresa_id = p_empresa and o.etapa = 'perdida' and o.borrado_en is null
                    and o.cerrada_en >= r.t0 and o.cerrada_en < r.t1),
    -- Objeciones de las últimas 4 semanas (una sola semana da muy poca señal).
    'objeciones', coalesce((
      select jsonb_agg(jsonb_build_object('motivo', x.motivo, 'veces', x.veces) order by x.veces desc, x.motivo)
        from (select lower(btrim(o.motivo_perdida)) as motivo, count(*) as veces
                from public.oportunidades o, rango r
               where o.empresa_id = p_empresa and o.etapa = 'perdida' and o.borrado_en is null
                 and o.cerrada_en >= r.t1 - interval '28 days' and o.cerrada_en < r.t1
               group by 1 order by 2 desc, 1 limit 5) x), '[]'::jsonb),
    'vencidos', (select jsonb_build_object('cantidad', count(*), 'saldo', coalesce(sum(saldo), 0))
                   from public.v_cobros where empresa_id = p_empresa and estado = 'vencido'),
    'por_pagar_equipo', (select coalesce(sum(valor), 0) from public.v_por_pagar_ayudantes where empresa_id = p_empresa),
    'stock_bajo', coalesce((select jsonb_agg(jsonb_build_object('nombre', nombre, 'stock', stock, 'minimo', stock_minimo) order by nombre)
                              from public.v_inventario where empresa_id = p_empresa and activo and bajo), '[]'::jsonb),
    'metas', coalesce((select jsonb_agg(jsonb_build_object(
                         'indicador', m.indicador, 'objetivo', m.objetivo, 'logrado', m.logrado,
                         'miembro', (select nombre from public.miembros where id = m.miembro_id),
                         'producto', (select nombre from public.productos where id = m.producto_id)) order by m.indicador)
                       from public.v_avance_metas m where m.empresa_id = p_empresa and m.semana = p_lunes), '[]'::jsonb)
  )
$$;

revoke execute on function public.resumen_semana(uuid, date) from public, anon;
grant execute on function public.resumen_semana(uuid, date) to authenticated;

-- ---------- 3. Índices -------------------------------------------------
create index if not exists pagos_empresa_fecha_idx on public.pagos(empresa_id, fecha) where anulado_en is null;
create index if not exists oport_cerrada_idx on public.oportunidades(empresa_id, cerrada_en) where borrado_en is null;
create index if not exists inv_mov_item_idx on public.inventario_movimientos(item_id);
create index if not exists comisiones_miembro_idx on public.comisiones(empresa_id, miembro_id, estado);
create index if not exists tareas_asignada_idx on public.tareas(empresa_id, asignada_a, estado) where borrado_en is null;
