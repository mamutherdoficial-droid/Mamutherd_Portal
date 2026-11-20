-- =====================================================================
-- Pruebas del esquema base. Corre con psql contra una base que ya tenga
-- la migración y la semilla (ver scripts/probar-sql.sh).
-- Falla con ERROR en la primera regla que no se cumpla.
-- Simula usuarios con request.jwt.claims, como hace Supabase.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Preparación (superusuario) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'jacobo@prueba.co'),
  ('00000000-0000-0000-0000-0000000000b1', 'ana@prueba.co'),
  ('00000000-0000-0000-0000-0000000000c1', 'bea@prueba.co')
on conflict do nothing;

update public.miembros set usuario_id = '00000000-0000-0000-0000-0000000000a1'
 where nombre = 'Jacobo López' and empresa_id = (select id from public.empresas where slug = 'mamut-herd');

insert into public.miembros (empresa_id, usuario_id, nombre, rol, forma_pago)
select id, '00000000-0000-0000-0000-0000000000b1', 'Ana (prueba)', 'ayudante', 'comision' from public.empresas where slug = 'mamut-herd'
on conflict do nothing;
insert into public.miembros (empresa_id, usuario_id, nombre, rol, forma_pago)
select id, '00000000-0000-0000-0000-0000000000c1', 'Bea (prueba)', 'ayudante', 'comision' from public.empresas where slug = 'mamut-herd'
on conflict do nothing;

-- Otra empresa, para probar que no se mezclan datos
insert into public.empresas (nombre, slug) values ('Otra Empresa', 'otra-empresa') on conflict do nothing;
insert into public.clientes (empresa_id, nombre_negocio)
select id, 'Cliente de otra empresa' from public.empresas where slug = 'otra-empresa';

-- ---------- Como gerente ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);

do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  ana uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  yo uuid := public.mi_miembro((select id from public.empresas where slug = 'mamut-herd'));
  cli uuid; op uuid; cob uuid; sus uuid; pl uuid; n int; total int; mes date;
begin
  assert (select count(*) from public.empresas) = 1, 'el gerente solo debe ver su empresa';
  assert (select count(*) from public.clientes where nombre_negocio = 'Cliente de otra empresa') = 0,
         'no se deben ver clientes de otra empresa';

  insert into public.clientes (empresa_id, nombre_negocio, tipo_negocio, origen, creado_por)
  values (e, 'Café Luna', 'cafetería', 'conocido', ana) returning id into cli;

  insert into public.oportunidades (empresa_id, cliente_id, producto_id, etapa, responsable_id)
  values (e, cli, (select id from public.productos where empresa_id = e and nombre = 'Nef'), 'propuesta', yo)
  returning id into op;
  insert into public.oportunidad_vendedores (oportunidad_id, miembro_id, empresa_id, atribucion, parte)
  values (op, ana, e, 'propia', 1);

  -- Instalación de $200.000 pagada en dos mitades → 25% para Ana = $50.000
  insert into public.cobros (empresa_id, cliente_id, oportunidad_id, concepto, valor, vence)
  values (e, cli, op, 'instalacion', 200000, '2026-11-25') returning id into cob;
  insert into public.pagos (empresa_id, cobro_id, valor, fecha) values (e, cob, 100000, '2026-11-24');
  assert (select sum(valor) from public.comisiones where miembro_id = ana) = 25000, 'anticipo: comisión de 25.000';
  insert into public.pagos (empresa_id, cobro_id, valor, fecha) values (e, cob, 100000, '2026-11-27');
  assert (select sum(valor) from public.comisiones where miembro_id = ana) = 50000, 'instalación completa: 50.000';
  assert (select estado from public.v_cobros where id = cob) = 'pagado', 'el cobro debe quedar pagado';

  update public.oportunidades set etapa = 'ganada', cerrada_en = '2026-11-27 15:00-05' where id = op;

  -- Plan Básico $35.000; 7 meses pagados → solo 6 meses de 10% = 6 × 3.500
  pl := (select id from public.planes where nombre = 'Plan Básico');
  insert into public.suscripciones (empresa_id, cliente_id, plan_id, oportunidad_id, precio_mensual, dia_cobro, inicia)
  values (e, cli, pl, op, 35000, 5, '2026-12-01') returning id into sus;

  for i in 0..6 loop
    mes := ('2026-12-01'::date + make_interval(months => i))::date;
    n := public.generar_mensualidades(e, mes);
    assert n = 1, 'debe crear 1 mensualidad por mes';
    assert public.generar_mensualidades(e, mes) = 0, 'correrla dos veces no duplica';
    insert into public.pagos (empresa_id, cobro_id, valor, fecha)
    select e, id, valor, vence from public.cobros where suscripcion_id = sus and periodo = mes;
  end loop;
  select count(*), sum(valor) into n, total from public.comisiones k
    join public.reglas_comision r on r.id = k.regla_id
   where k.miembro_id = ana and r.concepto = 'mensualidad';
  assert n = 6 and total = 21000, format('mensualidad: esperaba 6 comisiones por 21.000, hubo %s por %s', n, total);

  -- Anular un pago anula su comisión pendiente
  update public.pagos set anulado_en = now()
   where cobro_id = (select id from public.cobros where suscripcion_id = sus and periodo = '2026-12-01');
  assert (select count(*) from public.comisiones where estado = 'anulada') = 1, 'anular pago anula su comisión';

  -- Trabajo por pagar (fotos de la hermana)
  insert into public.tareas (empresa_id, titulo, tipo, asignada_a, cliente_id, estado, valor_trabajo, hecha_en)
  values (e, 'Fotos carta Café Luna', 'fotos', (select id from public.miembros where nombre = 'Hermana (fotos)'),
          cli, 'hecha', 150000, now());
  assert (select count(*) from public.v_por_pagar_ayudantes where origen = 'trabajo') = 1, 'trabajo por pagar visible';

  -- Inventario
  insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad, costo_total)
  values (e, (select id from public.inventario_items where nombre = 'Sticker NFC NTAG213'), 'compra', 50, 50000);
  insert into public.inventario_movimientos (empresa_id, item_id, tipo, cantidad, cliente_id)
  values (e, (select id from public.inventario_items where nombre = 'Sticker NFC NTAG213'), 'instalacion', -7, cli);
  assert (select stock from public.v_inventario where nombre = 'Sticker NFC NTAG213') = 43, 'stock 50 − 7 = 43';

  -- Avance de metas: 1 visita con dueño en la semana 1 (+ una meta de ingresos para probarla)
  insert into public.metas (empresa_id, semana, indicador, objetivo) values (e, '2026-11-23', 'ingresos', 500000);
  insert into public.actividades (empresa_id, cliente_id, oportunidad_id, miembro_id, tipo, hablo_con_dueno, fecha)
  values (e, cli, op, ana, 'visita', true, '2026-11-24 10:00-05');
  assert (select logrado from public.v_avance_metas where semana = '2026-11-23' and indicador = 'visitas') = 1, 'meta visitas';
  assert (select logrado from public.v_avance_metas where semana = '2026-11-23' and indicador = 'clientes_nuevos') = 1, 'meta clientes';
  assert (select logrado from public.v_avance_metas where semana = '2026-11-23' and indicador = 'ingresos') = 200000, 'meta ingresos';
end $$;

-- ---------- Como ayudante con ventas (Ana) ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare e uuid := (select id from public.empresas where slug = 'mamut-herd'); ok boolean := false;
begin
  assert (select count(*) from public.cobros) = 0, 'una ayudante no ve cobros';
  assert (select count(*) from public.pagos) = 0, 'una ayudante no ve pagos';
  assert (select count(*) from public.clientes) = 1, 'Ana ve su cliente';
  assert (select sum(valor) from public.comisiones where estado <> 'anulada') = 50000 + 17500,
         'Ana ve sus comisiones vigentes (50.000 + 5 meses × 3.500)';
  assert (select count(*) from public.tareas) = 0, 'Ana no ve tareas de otros';

  begin
    perform public.generar_mensualidades(e, '2027-07-01');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'una ayudante no puede generar mensualidades';

  -- Puede crear su propio cliente y oportunidad, pero no marcarla ganada
  insert into public.clientes (empresa_id, nombre_negocio, creado_por)
  values (e, 'Panadería Sol', public.mi_miembro(e));
  ok := false;
  begin
    insert into public.oportunidades (empresa_id, cliente_id, producto_id, etapa, responsable_id)
    values (e, (select id from public.clientes where nombre_negocio = 'Panadería Sol'),
            (select id from public.productos where nombre = 'Nef'), 'ganada', public.mi_miembro(e));
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'una ayudante no puede crear una oportunidad ganada';
end $$;

-- ---------- Como ayudante sin ventas (Bea) ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', false);
do $$
begin
  assert (select count(*) from public.comisiones) = 0, 'Bea no ve comisiones de Ana';
  assert (select count(*) from public.clientes) = 0, 'Bea no ve clientes de Ana';
  assert (select count(*) from public.productos) = 6, 'Bea sí ve el catálogo';
end $$;

-- ---------- Sin sesión (anon) ----------
reset role;
set role anon;
do $$
declare ok boolean := false;
begin
  begin perform 1 from public.clientes; exception when insufficient_privilege then ok := true; end;
  assert ok, 'anon no puede leer tablas';
end $$;
reset role;

-- ---------- Permisos de anon (migración permisos_por_defecto) ----------
do $$ begin
  assert not exists (select 1 from information_schema.role_table_grants
                     where grantee = 'anon' and table_schema = 'public'), 'anon no debe tener permisos en tablas ni vistas';
  assert not exists (select 1 from information_schema.role_routine_grants
                     where grantee = 'anon' and routine_schema = 'public'), 'anon no debe poder ejecutar funciones';
end $$;

\echo 'OK: todas las pruebas del esquema pasaron'
