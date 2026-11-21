-- =====================================================================
-- Pruebas de la Fase 4: inventario, metas y resumen de la semana.
-- Corre después de las pruebas de las fases anteriores (usa a1 gerente, b1 Ana).
-- Falla con ERROR en la primera regla que no se cumpla.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Inventario: comprar 50 e instalar 7 → 43 ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e     uuid := (select id from public.empresas where slug = 'mamut-herd');
  st    uuid := (select id from public.inventario_items where empresa_id = e and nombre = 'Sticker NFC NTAG213');
  cli   uuid := (select id from public.clientes where empresa_id = e and nombre_negocio = 'Café Fase Dos');
  antes int  := (select stock from public.v_inventario where id = st);
  ok    boolean := false;
begin
  insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad, costo_total, registrado_por)
  values (e, st, 'compra', 50, 50000, public.mi_miembro(e));
  insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad, cliente_id, registrado_por)
  values (e, st, 'instalacion', -7, cli, public.mi_miembro(e));
  assert (select stock from public.v_inventario where id = st) = antes + 43, 'compra 50 − instala 7 = +43';
  assert not (select bajo from public.v_inventario where id = st) or antes + 43 <= 20, 'con 43 no hay alerta';

  -- Baja de 20 → alerta.
  insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad, nota)
  values (e, st, 'dano', -(antes + 43 - 18), 'Prueba: se dañaron');
  assert (select stock from public.v_inventario where id = st) = 18, 'queda en 18';
  assert (select bajo from public.v_inventario where id = st), 'con 18 (mínimo 20) hay alerta';

  -- Una compra no puede ser negativa ni una instalación positiva.
  begin
    insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad) values (e, st, 'compra', -5);
  exception when check_violation then ok := true;
  end;
  assert ok, 'compra negativa rechazada';
  ok := false;
  begin
    insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad) values (e, st, 'instalacion', 5);
  exception when check_violation then ok := true;
  end;
  assert ok, 'instalación positiva rechazada';
end $$;

-- ---------- Metas ----------
do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  ana uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  lun date := date_trunc('week', (now() at time zone 'America/Bogota'))::date;
  m1  uuid;
  m2  uuid;
  ok  boolean := false;
begin
  m1 := public.guardar_meta(e, lun, 'visitas', 10, ana);
  m2 := public.guardar_meta(e, lun, 'visitas', 12, ana);
  assert m1 = m2, 'la misma meta no se duplica';
  assert (select objetivo from public.metas where id = m1) = 12, 'se actualiza el objetivo';
  begin
    perform public.guardar_meta(e, lun + 1, 'visitas', 10);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'la semana debe empezar el lunes';
  perform set_config('prueba.meta_ana', m1::text, false);
end $$;

-- La meta de visitas de Ana sube sola cuando anota una visita.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare
  e     uuid := (select id from public.empresas where slug = 'mamut-herd');
  nef   uuid := (select id from public.productos where empresa_id = e and nombre = 'Nef');
  meta  uuid := current_setting('prueba.meta_ana')::uuid;
  antes int  := (select logrado from public.v_avance_metas where id = meta);
  ok    boolean := false;
begin
  perform public.anotar_visita(e, nef, null, 'Panadería Fase Cuatro', true, 'interesado', 'Volver', null, null);
  assert (select logrado from public.v_avance_metas where id = meta) = antes + 1, 'la meta de visitas sube sola';
  -- Ana ve su meta, pero no pone metas ni ve inventario.
  assert (select count(*) from public.metas where id = meta) = 1, 'Ana ve su meta';
  assert (select count(*) from public.inventario_items) = 0, 'Ana no ve inventario';
  assert (select count(*) from public.inventario_movimientos) = 0, 'Ana no ve movimientos';
  begin
    perform public.guardar_meta(e, date_trunc('week', now())::date, 'visitas', 99);
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'Ana no pone metas';
end $$;

-- ---------- Resumen de la semana ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  lun date := date_trunc('week', (now() at time zone 'America/Bogota'))::date;
  r   jsonb;
begin
  r := public.resumen_semana(e, lun);
  assert (r->>'visitas')::int >= 1, 'cuenta las visitas de la semana';
  assert (r->>'clientes_nuevos')::int >= 1, 'cuenta los clientes nuevos (venta ganada en la Fase 2)';
  assert jsonb_typeof(r->'objeciones') = 'array', 'trae las objeciones';
  assert exists (select 1 from jsonb_array_elements(r->'stock_bajo') x where x->>'nombre' = 'Sticker NFC NTAG213'),
         'avisa del stock bajo';
  assert exists (select 1 from jsonb_array_elements(r->'metas') x where x->>'indicador' = 'visitas'), 'trae las metas';
end $$;
reset role;

\echo 'OK: pruebas de la Fase 4 pasaron'
