-- =====================================================================
-- Pruebas de la Fase 1: anotar_visita y recorridos_vistos.
-- Corre después de base_test.sql (usa sus usuarios: a1 gerente, b1 Ana, c1 Bea).
-- Falla con ERROR en la primera regla que no se cumpla.
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- anotar_visita, como Ana (ayudante) ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);

do $$
declare
  e   uuid := (select id from public.empresas where slug = 'mamut-herd');
  nef uuid := (select id from public.productos where empresa_id = e and nombre = 'Nef');
  r1 jsonb; r2 jsonb; r3 jsonb; r4 jsonb; r5 jsonb;
begin
  -- Negocio nuevo: crea cliente, oportunidad (contactado) y actividad.
  r1 := public.anotar_visita(e, nef, null, 'Panadería El Trigal', true, 'interesado',
                             'Volver con la demo', '2026-11-25', 'Le gustó la carta digital');
  assert (r1->>'cliente_nuevo')::boolean, 'debe crear el cliente nuevo';
  assert r1->>'etapa' = 'contactado', 'interesado → contactado';
  assert (select proxima_fecha from public.oportunidades where id = (r1->>'oportunidad_id')::uuid) = '2026-11-25',
         'guarda la próxima fecha';
  assert (select count(*) from public.actividades where oportunidad_id = (r1->>'oportunidad_id')::uuid) = 1,
         'registra la actividad';
  assert (select hablo_con_dueno from public.actividades where id = (r1->>'actividad_id')::uuid),
         'guarda si habló con el dueño';

  -- Mismo nombre (otra mayúscula): reutiliza el cliente y la oportunidad.
  r2 := public.anotar_visita(e, nef, null, 'panadería el trigal', false, 'pidio_propuesta',
                             'Mandar propuesta', '2026-11-26', null);
  assert not (r2->>'cliente_nuevo')::boolean, 'no duplica el cliente';
  assert r2->>'oportunidad_id' = r1->>'oportunidad_id', 'reutiliza la oportunidad abierta';
  assert r2->>'etapa' = 'propuesta', 'pidió propuesta → propuesta';

  -- "Volver otro día" no hace retroceder la etapa.
  r3 := public.anotar_visita(e, nef, (r1->>'cliente_id')::uuid, null, false, 'volver', 'Pasar el lunes', null, null);
  assert r3->>'etapa' = 'propuesta', 'la etapa nunca retrocede';
  assert (select proxima_fecha from public.oportunidades where id = (r1->>'oportunidad_id')::uuid) is null,
         'sin fecha queda sin fecha';

  -- "No le interesa" la cierra como perdida, con motivo.
  r4 := public.anotar_visita(e, nef, (r1->>'cliente_id')::uuid, null, true, 'no_interesa', null, null, 'Ya tiene carta en PDF');
  assert r4->>'etapa' = 'perdida', 'no le interesa → perdida';
  assert (select motivo_perdida from public.oportunidades where id = (r1->>'oportunidad_id')::uuid) = 'Ya tiene carta en PDF',
         'el motivo de pérdida sale de la nota';

  -- La siguiente visita a ese negocio abre una oportunidad nueva.
  r5 := public.anotar_visita(e, nef, (r1->>'cliente_id')::uuid, null, true, 'interesado', 'Llamar', '2026-12-01', null);
  assert r5->>'oportunidad_id' <> r1->>'oportunidad_id', 'una perdida no se reabre: se crea otra';

  -- Validaciones
  begin
    perform public.anotar_visita(e, nef, null, '   ', false, 'interesado', null, null, null);
    assert false, 'sin nombre debe fallar';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.anotar_visita(e, nef, null, 'Otro', false, 'ganada', null, null, null);
    assert false, 'resultado inválido debe fallar';
  exception when invalid_parameter_value then null;
  end;
end $$;

-- Bea no ve los clientes de Ana.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', false);
do $$ begin
  assert (select count(*) from public.clientes where nombre_negocio = 'Panadería El Trigal') = 0,
         'una ayudante no ve los clientes de otra';
end $$;

-- Nadie anota visitas en una empresa ajena.
do $$ begin
  begin
    perform public.anotar_visita((select id from public.empresas where slug = 'otra-empresa'),
                                 gen_random_uuid(), null, 'X', false, 'interesado', null, null, null);
    assert false, 'no debe anotar en otra empresa';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------- Recorridos vistos ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
insert into public.recorridos_vistos (usuario_id, empresa_id, recorrido, version, saltado)
select '00000000-0000-0000-0000-0000000000b1', id, 'bienvenida', 1, true from public.empresas where slug = 'mamut-herd'
on conflict (usuario_id, empresa_id, recorrido) do update set saltado = excluded.saltado;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1"}', false);
do $$ begin
  assert (select count(*) from public.recorridos_vistos) = 0, 'un usuario no ve los recorridos de otro';
  update public.recorridos_vistos set saltado = false;  -- no afecta filas ajenas (RLS)
  begin
    insert into public.recorridos_vistos (usuario_id, empresa_id, recorrido)
    select '00000000-0000-0000-0000-0000000000b1', id, 'ventas' from public.empresas where slug = 'mamut-herd';
    assert false, 'no puede escribir recorridos a nombre de otro';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$ begin
  assert (select saltado from public.recorridos_vistos where recorrido = 'bienvenida'),
         'Bea no pudo cambiar el recorrido de Ana';
end $$;
reset role;

-- ---------- anon sigue sin permisos ----------
do $$ begin
  assert not exists (select 1 from information_schema.role_table_grants
                     where grantee = 'anon' and table_schema = 'public'), 'anon no debe tener permisos en tablas';
  assert not exists (select 1 from information_schema.role_routine_grants
                     where grantee = 'anon' and routine_schema = 'public'), 'anon no debe poder ejecutar funciones';
end $$;

\echo 'OK: pruebas de la Fase 1 pasaron'
