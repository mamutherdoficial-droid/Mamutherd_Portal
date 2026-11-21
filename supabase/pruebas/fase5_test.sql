-- =====================================================================
-- Pruebas de la Fase 5: crear empresa y registro de exportaciones.
-- Corre después de las pruebas anteriores (usa a1 gerente de Mamut y f1 "colado" sin empresa).
-- =====================================================================
\set ON_ERROR_STOP on

-- ---------- Sin sesión no se crea nada ----------
reset role;
set role anon;
do $$
declare ok boolean := false;
begin
  begin
    perform public.crear_empresa('Negocio Anónimo', 'Nadie');
  exception when insufficient_privilege then ok := true;
  end;
  assert ok, 'anon no crea empresas';
end $$;
reset role;

-- ---------- Una cuenta nueva crea su empresa ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000f1"}', false);
do $$
declare
  e1 uuid;
  e2 uuid;
  ok boolean := false;
begin
  assert (select count(*) from public.empresas) = 0, 'antes no ve ninguna empresa';
  e1 := public.crear_empresa('Panadería Ñapa & Cía', 'Felipe Colado');
  assert (select slug from public.empresas where id = e1) = 'panaderia-napa-cia', 'slug sin tildes ni símbolos';
  assert public.es_gerente(e1), 'queda como gerente';
  assert (select count(*) from public.empresas) = 1, 've solo su empresa';
  assert (select count(*) from public.clientes) = 0, 'no ve clientes de otras empresas';
  assert (select count(*) from public.miembros) = 1, 'no ve miembros de otras empresas';

  -- Mismo nombre → otro slug.
  e2 := public.crear_empresa('Panadería Ñapa & Cía', 'Felipe Colado');
  assert (select slug from public.empresas where id = e2) = 'panaderia-napa-cia-2', 'slug único';
  perform public.crear_empresa('Tercera', 'Felipe Colado');
  begin
    perform public.crear_empresa('Cuarta', 'Felipe Colado');
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'máximo 3 empresas por cuenta';
  ok := false;
  begin
    perform public.crear_empresa(' ', 'Felipe');
  exception when invalid_parameter_value then ok := true;
  end;
  assert ok, 'sin nombre no se crea';

  -- Exportaciones: el gerente deja registro y lo ve.
  insert into public.exportaciones (empresa_id, miembro_id, tipo, filas) values (e1, public.mi_miembro(e1), 'clientes', 3);
  assert (select count(*) from public.exportaciones) = 1, 've su registro de exportación';
end $$;

-- ---------- Ana (ayudante de Mamut) no ve exportaciones ni la empresa nueva ----------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1"}', false);
do $$
declare ok boolean := false;
begin
  assert (select count(*) from public.exportaciones) = 0, 'Ana no ve exportaciones';
  assert not exists (select 1 from public.empresas where slug like 'panaderia-napa%'), 'Ana no ve empresas ajenas';
  begin
    insert into public.exportaciones (empresa_id, tipo) values ((select id from public.empresas where slug = 'mamut-herd'), 'clientes');
  exception when insufficient_privilege or check_violation then ok := true;
  end;
  assert ok, 'Ana no registra exportaciones';
end $$;
reset role;

\echo 'OK: pruebas de la Fase 5 pasaron'
