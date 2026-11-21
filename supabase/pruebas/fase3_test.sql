-- =====================================================================
-- Pruebas de la Fase 3: invitaciones y tareas.
-- Corre después de base_test.sql, fase1_test.sql y fase2_test.sql
-- (usa a1 gerente Jacobo, b1 Ana ayudante). Crea usuarios d1, e1, f1, g1.
-- Falla con ERROR en la primera regla que no se cumpla.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Preparación (superusuario) ----------
reset role;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'carla@prueba.co'),
  ('00000000-0000-0000-0000-0000000000e1', 'otra.gerente@prueba.co'),
  ('00000000-0000-0000-0000-0000000000f1', 'colado@prueba.co'),
  ('00000000-0000-0000-0000-0000000000a9', 'tarde@prueba.co')
on conflict do nothing;

-- Otra empresa con su gerente y una persona sin cuenta.
insert into public.empresas (nombre, slug) values ('Otra Prueba', 'otra-prueba') on conflict (slug) do nothing;
insert into public.miembros (empresa_id, usuario_id, nombre, rol, forma_pago)
select id, '00000000-0000-0000-0000-0000000000e1', 'Otra Gerente', 'gerente', 'ninguno' from public.empresas where slug = 'otra-prueba';
insert into public.miembros (empresa_id, nombre, rol, forma_pago)
select id, 'Dora (otra)', 'ayudante', 'comision' from public.empresas where slug = 'otra-prueba';

-- ---------- El gerente invita a Carla ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e     uuid := (select id from public.empresas where slug = 'mamut-herd');
  carla uuid;
  elsa  uuid;
  dora  uuid := (select m.id from public.miembros m where m.nombre = 'Dora (otra)');
  ok    boolean := false;
begin
  insert into public.miembros (empresa_id, nombre, rol, forma_pago, correo)
  values (e, 'Carla (prueba)', 'ayudante', 'comision', 'carla@prueba.co') returning id into carla;
  insert into public.miembros (empresa_id, nombre, rol, forma_pago)
  values (e, 'Elsa (prueba)', 'ayudante', 'por_trabajo') returning id into elsa;

  perform set_config('prueba.token_carla', public.crear_invitacion(carla), false);
  perform set_config('prueba.token_elsa', public.crear_invitacion(elsa), false);
  assert length(current_setting('prueba.token_carla')) = 64, 'token de 64 caracteres';
  assert not exists (select 1 from public.invitaciones where token_hash = current_setting('prueba.token_carla')),
         'el token no se guarda en claro';
  assert exists (select 1 from public.invitaciones where token_hash = public.hash_token(current_setting('prueba.token_carla'))),
         'se guarda su hash';

  -- Token de otra empresa: un gerente no puede invitar a alguien de otra empresa.
  begin
    perform public.crear_invitacion(dora);
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'no se invita a alguien de otra empresa';

  -- Una invitación nueva vence la anterior.
  perform set_config('prueba.token_viejo', current_setting('prueba.token_elsa'), false);
  perform set_config('prueba.token_elsa', public.crear_invitacion(elsa), false);
  assert (select count(*) from public.invitaciones where miembro_id = elsa and vence_en > now() and usada_en is null) = 1,
         'una sola invitación viva por persona';
end $$;

-- ---------- Una ayudante no invita ni ve invitaciones ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare ok boolean := false;
begin
  assert (select count(*) from public.invitaciones) = 0, 'Ana no ve invitaciones';
  begin
    perform public.crear_invitacion((select id from public.miembros where nombre = 'Carla (prueba)'));
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'Ana no puede invitar';
end $$;

-- ---------- Sin sesión no se acepta ----------
reset role;
set role anon;
do $$
declare ok boolean := false;
begin
  begin
    perform public.aceptar_invitacion(current_setting('prueba.token_carla'));
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'anon no puede aceptar invitaciones';
end $$;
reset role;

-- ---------- Carla acepta con su cuenta nueva ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000d1"}', false);
do $$
declare r jsonb;
begin
  assert (select count(*) from public.clientes) = 0, 'antes de aceptar, Carla no ve nada';
  r := public.aceptar_invitacion(current_setting('prueba.token_carla'));
  assert r->>'empresa' = 'Mamut Herd', 'queda en la empresa que la invitó';
  assert (select usuario_id from public.miembros where nombre = 'Carla (prueba)') = '00000000-0000-0000-0000-0000000000d1',
         'su cuenta queda vinculada';
  assert public.es_miembro((select id from public.empresas where slug = 'mamut-herd')), 'ya es miembro';
  assert not public.es_gerente((select id from public.empresas where slug = 'mamut-herd')), 'entra como ayudante';
  assert (select count(*) from public.cobros) = 0, 'Carla no ve cobros';
end $$;

-- ---------- Token usado dos veces → error ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1"}', false);
do $$
declare ok boolean := false;
begin
  begin
    perform public.aceptar_invitacion(current_setting('prueba.token_carla'));
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'un token usado no sirve otra vez';
  ok := false;
  begin
    perform public.aceptar_invitacion(current_setting('prueba.token_viejo'));
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'un token reemplazado ya no sirve';
  ok := false;
  begin
    perform public.aceptar_invitacion('a' || repeat('0', 63));
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'un token inventado no sirve';
end $$;

-- ---------- Token vencido → error ----------
reset role;
update public.invitaciones set vence_en = now() - interval '1 day'
 where token_hash = public.hash_token(current_setting('prueba.token_elsa'));
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a9"}', false);
do $$
declare ok boolean := false;
begin
  begin
    perform public.aceptar_invitacion(current_setting('prueba.token_elsa'));
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'un token vencido no sirve';
  assert (select usuario_id from public.miembros where nombre = 'Elsa (prueba)') is null, 'Elsa sigue sin cuenta';
end $$;

-- ---------- Tareas: trabajo de fotos ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  ana uuid := (select id from public.miembros where nombre = 'Ana (prueba)');
  t   uuid;
begin
  insert into public.tareas (empresa_id, titulo, tipo, asignada_a, valor_trabajo, creado_por)
  values (e, 'Fotos carta Café Fase Tres', 'fotos', ana, 80000, public.mi_miembro(e)) returning id into t;
  perform set_config('prueba.tarea', t::text, false);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare
  t  uuid := current_setting('prueba.tarea')::uuid;
  ok boolean := false;
begin
  -- Ana no puede subirse el valor.
  begin
    update public.tareas set valor_trabajo = 999000 where id = t;
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'Ana no cambia el valor del trabajo';
  -- Ana la marca hecha (aunque intente poner otra fecha, queda ahora).
  update public.tareas set estado = 'hecha', hecha_en = '2020-01-01' where id = t;
  assert (select hecha_en from public.tareas where id = t) > now() - interval '1 minute', 'hecha_en = ahora';
  assert exists (select 1 from public.v_por_pagar_ayudantes where origen = 'trabajo' and origen_id = t and valor = 80000),
         'aparece en Por pagar';
end $$;

-- El gerente marca hecha otra tarea: también queda la fecha.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1"}', false);
do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  t uuid;
begin
  insert into public.tareas (empresa_id, titulo, tipo) values (e, 'Revisar soportes', 'general') returning id into t;
  update public.tareas set estado = 'hecha' where id = t;
  assert (select hecha_en from public.tareas where id = t) is not null, 'hecha_en también para el gerente';
  update public.tareas set estado = 'pendiente' where id = t;
  assert (select hecha_en from public.tareas where id = t) is null, 'reabrir limpia hecha_en';
end $$;
reset role;

\echo 'OK: pruebas de la Fase 3 pasaron'
