-- =====================================================================
-- Fase 1 · Anotar visita en una sola acción (docs/DESIGN.md → "Anotar visita").
-- Crea o reutiliza el cliente, crea o actualiza la oportunidad del producto y
-- registra la actividad, todo en una transacción. security invoker: corre con
-- los permisos (RLS) de quien la llama. Se puede correr dos veces sin error.
-- =====================================================================

create or replace function public.anotar_visita(
  p_empresa         uuid,
  p_producto_id     uuid,
  p_cliente_id      uuid default null,     -- negocio existente…
  p_nombre_negocio  text default null,     -- …o el nombre de uno nuevo
  p_hablo_con_dueno boolean default false,
  p_resultado       text default 'interesado',  -- interesado | pidio_propuesta | volver | no_interesa
  p_proxima_accion  text default null,
  p_proxima_fecha   date default null,
  p_nota            text default null
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  yo          uuid := public.mi_miembro(p_empresa);
  v_cliente   uuid := p_cliente_id;
  v_nuevo     boolean := false;
  v_oport     uuid;
  v_etapa     text;
  v_destino   text;
  v_actividad uuid;
  v_nombre    text := nullif(btrim(p_nombre_negocio), '');
  v_nota      text := nullif(btrim(p_nota), '');
  orden constant text[] := array['prospecto','contactado','demo','propuesta'];
begin
  if yo is null then
    raise exception 'No perteneces a esta empresa' using errcode = '42501';
  end if;
  if p_resultado not in ('interesado','pidio_propuesta','volver','no_interesa') then
    raise exception 'Resultado no válido: %', p_resultado using errcode = '22023';
  end if;
  if not exists (select 1 from public.productos where id = p_producto_id and empresa_id = p_empresa
                 and activo and borrado_en is null) then
    raise exception 'Ese producto no existe en tu empresa' using errcode = '22023';
  end if;

  -- 1. Cliente: el elegido, uno con el mismo nombre, o uno nuevo.
  if v_cliente is null then
    if v_nombre is null then
      raise exception 'Escribe el nombre del negocio' using errcode = '22023';
    end if;
    select id into v_cliente from public.clientes
     where empresa_id = p_empresa and borrado_en is null and lower(nombre_negocio) = lower(v_nombre)
     order by creado_en limit 1;
    if v_cliente is null then
      insert into public.clientes (empresa_id, nombre_negocio, origen, creado_por)
      values (p_empresa, v_nombre, 'visita', yo)
      returning id into v_cliente;
      v_nuevo := true;
    end if;
  elsif not exists (select 1 from public.clientes where id = v_cliente and empresa_id = p_empresa
                    and borrado_en is null) then
    raise exception 'Ese negocio no existe o no lo puedes ver' using errcode = '22023';
  end if;

  -- 2. Oportunidad abierta de ese producto (o una nueva).
  select id, etapa into v_oport, v_etapa from public.oportunidades
   where cliente_id = v_cliente and producto_id = p_producto_id and borrado_en is null
     and etapa not in ('ganada','perdida')
   order by creado_en desc limit 1;

  v_destino := case p_resultado
                 when 'pidio_propuesta' then 'propuesta'
                 when 'no_interesa' then 'perdida'
                 else 'contactado' end;

  if v_oport is null then
    insert into public.oportunidades (empresa_id, cliente_id, producto_id, etapa, responsable_id,
                                      proxima_accion, proxima_fecha, motivo_perdida)
    values (p_empresa, v_cliente, p_producto_id, v_destino, yo,
            case when v_destino = 'perdida' then null else nullif(btrim(p_proxima_accion), '') end,
            case when v_destino = 'perdida' then null else p_proxima_fecha end,
            case when v_destino = 'perdida' then coalesce(v_nota, 'No le interesa') end)
    returning id into v_oport;
  else
    -- La etapa solo avanza (nunca retrocede), salvo "no le interesa", que la cierra como perdida.
    if v_destino <> 'perdida'
       and array_position(orden, v_destino) <= coalesce(array_position(orden, v_etapa), 0) then
      v_destino := v_etapa;
    end if;
    update public.oportunidades
       set etapa = v_destino,
           proxima_accion = case when v_destino = 'perdida' then null else nullif(btrim(p_proxima_accion), '') end,
           proxima_fecha  = case when v_destino = 'perdida' then null else p_proxima_fecha end,
           motivo_perdida = case when v_destino = 'perdida' then coalesce(v_nota, 'No le interesa') else motivo_perdida end
     where id = v_oport;
  end if;

  -- 3. La actividad (siempre).
  insert into public.actividades (empresa_id, cliente_id, oportunidad_id, miembro_id, tipo, hablo_con_dueno, resultado)
  values (p_empresa, v_cliente, v_oport, yo, 'visita', coalesce(p_hablo_con_dueno, false),
          case p_resultado
            when 'interesado' then 'Interesado'
            when 'pidio_propuesta' then 'Pidió propuesta'
            when 'volver' then 'Volver otro día'
            else 'No le interesa' end
          || coalesce(' · ' || v_nota, ''))
  returning id into v_actividad;

  return jsonb_build_object('cliente_id', v_cliente, 'oportunidad_id', v_oport,
                            'actividad_id', v_actividad, 'cliente_nuevo', v_nuevo, 'etapa', v_destino);
end $$;

revoke execute on function public.anotar_visita(uuid, uuid, uuid, text, boolean, text, text, date, text) from public, anon;
grant execute on function public.anotar_visita(uuid, uuid, uuid, text, boolean, text, text, date, text) to authenticated;

-- Seguimientos rápidos por empresa y fecha (para /hoy).
create index if not exists oport_seguimiento_idx on public.oportunidades(empresa_id, proxima_fecha)
  where borrado_en is null and etapa not in ('ganada','perdida');
