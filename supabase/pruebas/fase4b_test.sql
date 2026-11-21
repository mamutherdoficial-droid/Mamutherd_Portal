-- =====================================================================
-- Pruebas de la Fase 4b: conciliar con el extracto del banco.
-- Corre después de las pruebas anteriores (usa a1 gerente, b1 Ana y la venta
-- "Café Fase Dos" de la Fase 2, con vendedora Ana "propia").
-- =====================================================================
\set ON_ERROR_STOP on

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e     uuid := (select id from public.empresas where slug = 'mamut-herd');
  op    uuid := current_setting('prueba.op')::uuid;
  cli   uuid := current_setting('prueba.cli')::uuid;
  ana   uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  cobro uuid;
  ext   uuid;
  mv    uuid;
  pago  uuid;
  ok    boolean := false;
begin
  -- Un cobro nuevo de instalación (la venta de la Fase 2 sigue con Ana como vendedora).
  insert into public.cobros (empresa_id, cliente_id, oportunidad_id, concepto, descripcion, valor, vence)
  values (e, cli, op, 'instalacion', 'Instalación extra', 80000, current_date) returning id into cobro;

  insert into public.extractos (empresa_id, banco, archivo, filas, nuevos) values (e, 'nequi', 'prueba.csv', 1, 1) returning id into ext;
  insert into public.movimientos_banco (empresa_id, extracto_id, banco, fecha, descripcion, valor, huella)
  values (e, ext, 'nequi', current_date, 'PAGO CAFE FASE DOS', 80000, 'huella-1') returning id into mv;

  -- La misma huella no entra dos veces.
  begin
    insert into public.movimientos_banco (empresa_id, banco, fecha, descripcion, valor, huella)
    values (e, 'nequi', current_date, 'PAGO CAFE FASE DOS', 80000, 'huella-1');
  exception when unique_violation then ok := true;
  end;
  assert ok, 'subir el mismo movimiento dos veces no duplica';

  -- Confirmar crea el pago y la comisión de Ana (25% de 80.000 = 20.000).
  pago := public.confirmar_movimiento(mv, cobro);
  assert (select valor from public.pagos where id = pago) = 80000, 'se crea el pago';
  assert (select medio from public.pagos where id = pago) = 'nequi', 'con el medio del banco';
  assert (select estado from public.v_cobros where id = cobro) = 'pagado', 'el cobro queda pagado';
  assert (select valor from public.comisiones where pago_id = pago and miembro_id = ana) = 20000, 'y la comisión de Ana';
  assert (select estado from public.movimientos_banco where id = mv) = 'confirmado', 'el movimiento queda confirmado';

  -- Confirmarlo otra vez no duplica.
  ok := false;
  begin
    perform public.confirmar_movimiento(mv, cobro);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'confirmar dos veces da error';
  assert (select count(*) from public.pagos where cobro_id = cobro and anulado_en is null) = 1, 'un solo pago';

  -- Un movimiento mayor que el saldo no se confirma.
  insert into public.cobros (empresa_id, cliente_id, concepto, valor, vence) values (e, cli, 'otro', 10000, current_date) returning id into cobro;
  insert into public.movimientos_banco (empresa_id, banco, fecha, descripcion, valor, huella)
  values (e, 'bancolombia', current_date, 'TRANSFERENCIA', 50000, 'huella-2') returning id into mv;
  ok := false;
  begin
    perform public.confirmar_movimiento(mv, cobro);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'no se confirma un movimiento mayor que el saldo';
  perform set_config('prueba.mv2', mv::text, false);
end $$;

-- Ana no ve extractos ni movimientos, ni confirma.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare ok boolean := false;
begin
  assert (select count(*) from public.extractos) = 0, 'Ana no ve extractos';
  assert (select count(*) from public.movimientos_banco) = 0, 'Ana no ve movimientos';
  begin
    perform public.confirmar_movimiento(current_setting('prueba.mv2')::uuid, gen_random_uuid());
  exception when no_data_found or insufficient_privilege then ok := true;
  end;
  assert ok, 'Ana no confirma';
end $$;
reset role;

\echo 'OK: pruebas de la Fase 4b pasaron'
