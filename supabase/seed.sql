-- =====================================================================
-- Semilla: Mamut Herd como primera empresa, con lo acordado en el
-- "Plan de ventas" y los "Acuerdos con ayudantes" (nov 2026).
-- Se puede correr dos veces sin duplicar.
-- El gerente (Jacobo) se vincula después a su usuario: ver COMO-EMPEZAR.md.
-- =====================================================================

insert into public.empresas (nombre, slug) values ('Mamut Herd', 'mamut-herd')
on conflict (slug) do nothing;

do $$
declare
  e uuid := (select id from public.empresas where slug = 'mamut-herd');
  sobremesa uuid;
begin
  -- Equipo (sin acceso al portal todavía: usuario_id null hasta la fase 3)
  insert into public.miembros (empresa_id, nombre, rol, forma_pago)
  select e, x.nombre, x.rol, x.pago
  from (values ('Jacobo López','gerente','ninguno'),
               ('Hermana (fotos)','ayudante','por_trabajo')) as x(nombre, rol, pago)
  where not exists (select 1 from public.miembros m where m.empresa_id = e and m.nombre = x.nombre);

  -- Productos
  insert into public.productos (empresa_id, nombre, descripcion, orden) values
    (e, 'Nef', 'NFC + QR en las mesas: portal del negocio, carta digital, reseñas y estadísticas', 1),
    (e, 'Antesala',  'Experiencias 3D de hoteles antes de reservar', 2),
    (e, 'Tino',      'Cuadre de caja para negocios con puntos de venta', 3),
    (e, 'Prodigia',  'App de práctica mental por mundos; plan Pro y panel docente', 4),
    (e, 'Velora',    'Launcher Android', 5),
    (e, 'Impromptu', 'Visualizador de piano gratuito', 6)
  on conflict (empresa_id, nombre) do nothing;

  sobremesa := (select id from public.productos where empresa_id = e and nombre = 'Nef');

  -- Planes de Nef (precios de lanzamiento del plan de ventas)
  insert into public.planes (empresa_id, producto_id, nombre, tipo, precio, descripcion) values
    (e, sobremesa, 'Instalación',            'unico',   200000, 'Hasta 6 soportes de mesa + 1 placa de caja, configurado'),
    (e, sobremesa, 'Instalación fundador',   'unico',   120000, 'Solo los 3 primeros clientes'),
    (e, sobremesa, 'Plan Básico',            'mensual',  35000, 'Portal, reseñas, WiFi, WhatsApp, estadísticas'),
    (e, sobremesa, 'Plan Carta',             'mensual',  55000, 'Básico + carta digital animada y ruleta'),
    (e, sobremesa, 'Fotos de la carta',      'unico',     null, 'Tarifa de la fotógrafa + 20%; se cotiza')
  on conflict (producto_id, nombre) do nothing;

  -- Reglas de comisión (acuerdos con ayudantes)
  insert into public.reglas_comision (empresa_id, atribucion, concepto, porcentaje, meses_max) values
    (e, 'propia',   'instalacion', 25, null),
    (e, 'propia',   'mensualidad', 10, 6),
    (e, 'conjunta', 'instalacion', 15, null),
    (e, 'referido', 'instalacion', 10, null)
  on conflict (empresa_id, atribucion, concepto) do nothing;

  -- Inventario
  insert into public.inventario_items (empresa_id, nombre, costo_unitario, stock_minimo) values
    (e, 'Sticker NFC NTAG213', 1000, 20),
    (e, 'Soporte acrílico de mesa', null, 6),
    (e, 'Placa de caja', null, 1)
  on conflict (empresa_id, nombre) do nothing;

  -- Metas de empresa, semanas 1 a 4 (23 nov – 20 dic 2026)
  insert into public.metas (empresa_id, semana, indicador, objetivo)
  select e, s.semana::date, s.ind, s.obj
  from (values
    ('2026-11-23','visitas',15), ('2026-11-23','conversaciones_dueno',6),  ('2026-11-23','clientes_nuevos',2),
    ('2026-11-30','visitas',25), ('2026-11-30','conversaciones_dueno',10), ('2026-11-30','clientes_nuevos',2),
    ('2026-12-07','visitas',25), ('2026-12-07','conversaciones_dueno',10), ('2026-12-07','clientes_nuevos',2),
    ('2026-12-14','visitas',15), ('2026-12-14','conversaciones_dueno',6),  ('2026-12-14','clientes_nuevos',2)
  ) as s(semana, ind, obj)
  on conflict do nothing;
end $$;
