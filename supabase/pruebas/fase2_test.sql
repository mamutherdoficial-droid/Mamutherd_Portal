-- =====================================================================
-- Pruebas de la Fase 2: cerrada_en, ganar_oportunidad, mensualidades,
-- anular pagos y comisiones. Corre después de base_test.sql y fase1_test.sql
-- (usa sus usuarios: a1 gerente Jacobo, b1 Ana, c1 Bea).
-- Falla con ERROR en la primera regla que no se cumpla.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Preparación: una venta de Ana (propia) ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);

do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  nef uuid := (select id from public.productos where empresa_id = e and nombre = 'Nef');
  ana uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  cli uuid;
  op  uuid;
begin
  insert into public.clientes (empresa_id, nombre_negocio, creado_por) values (e, 'Café Fase Dos', ana) returning id into cli;
  insert into public.oportunidades (empresa_id, cliente_id, producto_id, etapa, responsable_id)
  values (e, cli, nef, 'propuesta', ana) returning id into op;
  insert into public.oportunidad_vendedores (empresa_id, oportunidad_id, miembro_id, atribucion, parte)
  values (e, op, ana, 'propia', 1);
  perform set_config('prueba.op', op::text, false);
  perform set_config('prueba.cli', cli::text, false);
end $$;

-- ---------- Una ayudante no puede ganar una venta ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare
  e  uuid := (select id from public.empresas where slug = 'mamut-herd');
  pi uuid;
  ok boolean := false;
begin
  -- Ana ve los planes (son de lectura para miembros).
  pi := (select id from public.planes where empresa_id = e and nombre = 'Instalación');
  begin
    perform public.ganar_oportunidad(current_setting('prueba.op')::uuid, pi, 200000, current_date);
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'una ayudante no puede marcar ganada';
end $$;

-- ---------- El gerente gana la venta con anticipo del 50% ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e    uuid := (select id from public.empresas where slug = 'mamut-herd');
  op   uuid := current_setting('prueba.op')::uuid;
  ana  uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  pi   uuid := (select id from public.planes where empresa_id = e and nombre = 'Instalación');
  pm   uuid := (select id from public.planes where empresa_id = e and nombre = 'Plan Básico');
  r    jsonb;
  hoy  date := (now() at time zone 'America/Bogota')::date;
  meta uuid;
  antes int;
  ok   boolean := false;
begin
  -- Meta de clientes nuevos de esta semana, antes de ganar.
  insert into public.metas (empresa_id, semana, indicador, objetivo)
  values (e, date_trunc('week', hoy)::date, 'clientes_nuevos', 3) returning id into meta;
  antes := (select logrado from public.v_avance_metas where id = meta);

  -- Validaciones
  begin
    perform public.ganar_oportunidad(op, pi, 200000, hoy, null, null, 1, null, 300000);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'el anticipo no puede superar la instalación';
  ok := false;
  begin
    perform public.ganar_oportunidad(op, pm, 200000, hoy);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'la instalación necesita un plan único, no mensual';

  r := public.ganar_oportunidad(op, pi, 200000, hoy, pm, null, 5, null, 100000, 'nequi', hoy);

  assert (select etapa from public.oportunidades where id = op) = 'ganada', 'queda ganada';
  assert (select cerrada_en from public.oportunidades where id = op) is not null, 'cerrada_en se llena';
  assert (select logrado from public.v_avance_metas where id = meta) = antes + 1, 'la meta de clientes nuevos sube';
  assert (select valor from public.cobros where id = (r->>'cobro_id')::uuid) = 200000, 'cobro de instalación';
  assert (select precio_mensual from public.suscripciones where id = (r->>'suscripcion_id')::uuid) = 35000,
         'precio mensual congelado del plan';
  assert (select dia_cobro from public.suscripciones where id = (r->>'suscripcion_id')::uuid) = 5, 'día de cobro';
  assert (select inicia from public.suscripciones where id = (r->>'suscripcion_id')::uuid)
         = (date_trunc('month', hoy) + interval '1 month')::date, 'la mensualidad empieza el mes siguiente';
  assert (r->>'comisiones')::int = 25000, 'anticipo $100.000 → Ana $25.000';
  assert (select saldo from public.v_cobros where id = (r->>'cobro_id')::uuid) = 100000, 'saldo $100.000';
  assert (select estado from public.v_cobros where id = (r->>'cobro_id')::uuid) = 'parcial', 'cobro parcial';

  -- Pago del resto → Ana completa $50.000.
  insert into public.pagos (empresa_id, cobro_id, valor, medio) values (e, (r->>'cobro_id')::uuid, 100000, 'bancolombia');
  assert (select sum(valor) from public.comisiones where oportunidad_id = op and miembro_id = ana and estado = 'pendiente') = 50000,
         'Ana completa $50.000';
  assert (select estado from public.v_cobros where id = (r->>'cobro_id')::uuid) = 'pagado', 'cobro pagado';

  -- No se puede ganar dos veces.
  ok := false;
  begin
    perform public.ganar_oportunidad(op, pi, 200000, hoy);
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'una venta ganada no se vuelve a ganar';

  -- Reabrirla limpia cerrada_en; volver a cerrarla lo llena.
  update public.oportunidades set etapa = 'propuesta' where id = op;
  assert (select cerrada_en from public.oportunidades where id = op) is null, 'reabrir limpia cerrada_en';
  update public.oportunidades set etapa = 'ganada' where id = op;
  assert (select cerrada_en from public.oportunidades where id = op) is not null, 'cerrar de nuevo la llena';

  -- Motivo de pérdida vacío: la base lo rechaza.
  ok := false;
  begin
    update public.oportunidades set etapa = 'perdida', motivo_perdida = '   ' where id = op;
  exception when check_violation then ok := true;
  end;
  assert ok, 'el motivo de pérdida no puede ser vacío';
end $$;

-- ---------- Mensualidades: dos veces no duplica ----------
do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  mes date := (date_trunc('month', now() at time zone 'America/Bogota') + interval '1 month')::date;
  n1  int;
  n2  int;
begin
  n1 := public.generar_mensualidades(e, mes);
  n2 := public.generar_mensualidades(e, mes);
  assert n1 >= 1, 'crea la mensualidad del mes siguiente';
  assert n2 = 0, 'la segunda vez no crea nada';
  assert (select valor from public.cobros where concepto = 'mensualidad' and periodo = mes
           and cliente_id = current_setting('prueba.cli')::uuid) = 35000, 'mensualidad con precio congelado';
end $$;

-- ---------- Anular pagos ----------
do $$
declare
  op   uuid := current_setting('prueba.op')::uuid;
  ana  uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  p1   uuid;
  p2   uuid;
begin
  select k.pago_id into p1 from public.comisiones k join public.pagos p on p.id = k.pago_id
   where k.oportunidad_id = op and k.miembro_id = ana order by p.creado_en limit 1;
  select k.pago_id into p2 from public.comisiones k join public.pagos p on p.id = k.pago_id
   where k.oportunidad_id = op and k.miembro_id = ana and k.pago_id <> p1 limit 1;

  -- La comisión del primer pago ya se le pagó a Ana.
  update public.comisiones set estado = 'pagada', pagada_en = current_date, medio_pago = 'nequi' where pago_id = p1;

  update public.pagos set anulado_en = now() where id in (p1, p2);
  assert (select estado from public.comisiones where pago_id = p2) = 'anulada', 'comisión pendiente → anulada';
  assert (select estado from public.comisiones where pago_id = p1) = 'pagada', 'la ya pagada no se toca';
  -- La alerta: comisión pagada sobre un pago anulado y sin ajustar.
  assert (select count(*) from public.comisiones k join public.pagos p on p.id = k.pago_id
           where k.estado = 'pagada' and p.anulado_en is not null and k.ajustada_en is null and k.oportunidad_id = op) = 1,
         'aparece la alerta de comisión pagada';
  update public.comisiones set ajustada_en = now() where pago_id = p1;
  assert (select count(*) from public.comisiones k join public.pagos p on p.id = k.pago_id
           where k.estado = 'pagada' and p.anulado_en is not null and k.ajustada_en is null and k.oportunidad_id = op) = 0,
         '"Ya lo descontó" cierra la alerta';
end $$;

-- ---------- Ana ve sus comisiones, pero no cobros ni pagos ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$ begin
  assert (select count(*) from public.cobros) = 0, 'Ana no ve cobros';
  assert (select count(*) from public.pagos) = 0, 'Ana no ve pagos';
  assert (select count(*) from public.suscripciones) = 0, 'Ana no ve suscripciones';
  assert (select count(*) from public.v_cobros) = 0, 'Ana no ve v_cobros';
  assert (select count(*) from public.comisiones where oportunidad_id = current_setting('prueba.op')::uuid) = 2,
         'Ana ve sus dos comisiones de esta venta';
end $$;
reset role;

\echo 'OK: pruebas de la Fase 2 pasaron'
