-- =====================================================================
-- Pruebas de mapa y rutas (fase 1b). Corre después de base_test.sql,
-- que crea los usuarios de prueba (Jacobo gerente, Ana y Bea ayudantes).
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Como gerente ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);

do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  ok boolean := false;
begin
  -- Ubicación válida
  update public.clientes set lat = 4.6336, lng = -74.0660, ubicacion_fuente = 'gps', ubicado_en = now()
   where empresa_id = e and nombre_negocio = 'Café Luna';
  assert (select lat from public.clientes where nombre_negocio = 'Café Luna') = 4.6336, 'guarda la ubicación';

  -- Coordenadas a medias o fuera de rango: no
  begin
    update public.clientes set lat = 4.6, lng = null where nombre_negocio = 'Café Luna';
  exception when check_violation then ok := true;
  end;
  assert ok, 'no se acepta latitud sin longitud';
  ok := false;
  begin
    update public.clientes set lat = 95, lng = -74 where nombre_negocio = 'Café Luna';
  exception when check_violation then ok := true;
  end;
  assert ok, 'no se acepta latitud fuera de rango';
end $$;

-- Como superusuario: un negocio de otra empresa no entra a una ruta de Mamut
reset role;
do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  yo uuid := (select id from public.miembros where nombre = 'Jacobo López');
  r uuid; ok boolean := false;
begin
  insert into public.rutas (empresa_id, miembro_id, fecha, nombre)
  values (e, yo, '2026-11-24', 'Prueba cruzada') returning id into r;
  begin
    insert into public.ruta_paradas (empresa_id, ruta_id, cliente_id, orden)
    values (e, r, (select id from public.clientes where nombre_negocio = 'Cliente de otra empresa'), 1);
  exception when check_violation then ok := true;
  end;
  assert ok, 'una parada no puede apuntar a un negocio de otra empresa';
  delete from public.rutas where id = r;
end $$;

-- ---------- Como ayudante (Ana) ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);

do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  yo uuid := public.mi_miembro((select id from public.empresas where slug = 'mamut-herd'));
  bea uuid := (select id from public.miembros where nombre = 'Bea (prueba)');
  luna uuid := (select id from public.clientes where nombre_negocio = 'Café Luna');
  sol uuid := (select id from public.clientes where nombre_negocio = 'Panadería Sol');
  r uuid; p1 uuid; p2 uuid; ok boolean := false;
begin
  -- Su propia ruta, con dos negocios suyos
  insert into public.rutas (empresa_id, miembro_id, fecha, nombre)
  values (e, yo, '2026-11-24', 'Chapinero · Cra 13') returning id into r;
  insert into public.ruta_paradas (empresa_id, ruta_id, cliente_id, orden) values (e, r, luna, 1) returning id into p1;
  insert into public.ruta_paradas (empresa_id, ruta_id, cliente_id, orden) values (e, r, sol, 2) returning id into p2;
  assert (select count(*) from public.v_ruta_paradas where ruta_id = r) = 2, 'Ana ve sus 2 paradas en la vista';

  -- No puede crear rutas a nombre de Bea
  begin
    insert into public.rutas (empresa_id, miembro_id, fecha, nombre) values (e, bea, '2026-11-24', 'Ajena');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'una ayudante no crea rutas a nombre de otra';

  -- Reordenar: completo sí, incompleto no
  perform public.reordenar_ruta(r, array[p2, p1]);
  assert (select orden from public.ruta_paradas where id = p2) = 1, 'reordenar cambia el orden';
  ok := false;
  begin
    perform public.reordenar_ruta(r, array[p2]);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'reordenar exige todas las paradas';

  -- Anotar la visita marca la parada (fecha 24 nov a las 10 a. m. de Bogotá)
  insert into public.actividades (empresa_id, cliente_id, miembro_id, tipo, hablo_con_dueno, fecha)
  values (e, luna, yo, 'visita', true, '2026-11-24 10:00:00-05');
  assert (select estado from public.ruta_paradas where id = p1) = 'visitada', 'la visita marca la parada';
  assert (select hecha_en from public.ruta_paradas where id = p1) is not null, 'queda la hora de la visita';

  -- Una visita de otro día no marca la parada de hoy
  insert into public.actividades (empresa_id, cliente_id, miembro_id, tipo, fecha)
  values (e, sol, yo, 'visita', '2026-11-25 10:00:00-05');
  assert (select estado from public.ruta_paradas where id = p2) = 'pendiente', 'una visita de otro día no marca';

  -- Quitar: la pendiente sí se puede quitar; la visitada se queda
  delete from public.ruta_paradas where id = p1;
  assert (select count(*) from public.ruta_paradas where id = p1) = 1, 'una parada visitada no se borra';
  delete from public.ruta_paradas where id = p2;
  assert (select count(*) from public.ruta_paradas where id = p2) = 0, 'una parada pendiente sí se quita';
end $$;

-- ---------- Como ayudante sin clientes (Bea) ----------
reset role;
select set_config('prueba.luna', (select id::text from public.clientes where nombre_negocio = 'Café Luna'), false);
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', false);
do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  yo uuid := public.mi_miembro((select id from public.empresas where slug = 'mamut-herd'));
  r uuid; ok boolean := false;
  luna uuid := current_setting('prueba.luna')::uuid;
begin
  assert (select count(*) from public.rutas) = 0, 'Bea no ve la ruta de Ana';
  assert (select count(*) from public.ruta_paradas) = 0, 'Bea no ve paradas de Ana';

  insert into public.rutas (empresa_id, miembro_id, fecha, nombre)
  values (e, yo, '2026-11-24', 'Suba · Cra 92') returning id into r;

  -- Café Luna es de Ana: Bea no lo ve, así que no puede meterlo en su ruta
  begin
    insert into public.ruta_paradas (empresa_id, ruta_id, cliente_id, orden) values (e, r, luna, 1);
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'una ayudante no mete en su ruta un negocio que no ve';
end $$;

-- ---------- Sin sesión (anon) ----------
reset role;
set role anon;
do $$
declare ok boolean := false;
begin
  begin perform 1 from public.rutas; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon no puede leer rutas';
end $$;
reset role;

\echo 'OK: pruebas de mapa y rutas pasaron'
