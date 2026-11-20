# Decisiones

Formato: D-0XX · fecha · decisión · por qué · qué se descartó. Las nuevas van al final.

**D-001 · 2026-11-19 · Producto aparte de Tino, con la misma base.**
Tino cuadra la caja diaria de puntos de venta; el portal administra clientes, ventas, cobros y equipo.
Son compradores y momentos distintos, y meter esto en Tino lo volvería un ERP como Daplox.
Comparten forma de `empresas`/`miembros`, reglas (pesos enteros, borrado lógico, RLS, hora Bogotá)
y login. (El diseño compartido quedó reemplazado por D-011: el portal usa la estética de Mamut.) Descartado: módulo de Tino; herramienta solo interna sin base de producto.

**D-002 · 2026-11-19 · Multi-empresa desde el primer día.** Mamut es la primera empresa. Cuesta poco ahora
(una columna y RLS) y evita reescribir todo en la fase 5.

**D-003 · 2026-11-19 · Dinero en pesos enteros (`int`).** Igual que Tino y Nef. Sin decimales.

**D-004 · 2026-11-19 · Las comisiones las crea la base al registrar un pago (trigger).** Regla de los acuerdos:
nadie cobra sobre plata que no entró. Centralizarlo en la base evita que dos pantallas calculen distinto.
Descartado: calcular comisiones al marcar la venta ganada.

**D-005 · 2026-11-19 · Sin pasarela de pagos.** Se registran pagos que ya entraron (Nequi, Bancolombia,
efectivo). Una pasarela exige documento y empresa constituida; se revisa en la fase 5.

**D-006 · 2026-11-19 · WhatsApp con enlaces `wa.me`, sin API.** Cero costo y sin aprobación de Meta.
El mensaje se escribe en la app y se envía a mano.

**D-007 · 2026-11-19 · Sin integración con Nef en fases 1–4.** El negocio se crea en ambos lados a mano
y los tags se cuentan en el inventario del portal. Integrar antes de tener clientes es trabajo sin retorno.

**D-008 · 2026-11-19 · Borrado lógico.** `borrado_en` en entidades y `anulado_en` en cobros y pagos.
Las comisiones dependen del historial de pagos: borrar filas rompería las cuentas.

**D-009 · 2026-11-19 · Nombre de trabajo "Portal Mamut"; nombres internos neutros.** El nombre comercial se
decide en la fase 5. Tablas y carpetas no llevan la marca.

**D-010 · 2026-11-19 · Solo un gerente marca una oportunidad como ganada.** Así una venta cuenta cuando
Jacobo confirmó el pago, no cuando alguien lo anota con entusiasmo.

**D-011 · 2026-11-20 · Estética de Mamut Herd, no la de Tino.** Reemplaza la parte de diseño de D-001.
El portal es un producto de Mamut y se ve como Mamut: colores, letra y logos salen del kit de marca en
`docs/mamut-herd/` (actualizado el 2026-11-20; ya no hace falta leer la web de Mamut). Con Tino se comparte la base técnica, no el aspecto. Descartado: paleta ciruela de Tino.

**D-012 · 2026-11-20 · Sin permisos por defecto para `anon`.** Supabase da permisos a `anon` sobre tablas y
funciones nuevas de `public`; la migración `…0100_permisos_por_defecto.sql` los quita. Las pruebas en un
Postgres limpio no lo mostraban, por eso `/verificar` lo revisa contra la base de `supabase start`.

**D-013 · 2026-11-20 · Un solo proyecto de Supabase en la nube (`mamut-portal`).** El plan gratis permite
2 proyectos activos y pausa los que pasan una semana sin uso; Nef y Milagros ya ocupan cupos.
El ambiente de pruebas es el Supabase local con Docker. Descartado: proyectos `-pruebas` y `-produccion` en la nube.

**D-014 · 2026-11-20 · Correo y contraseña para todos; ayudantes por invitación.** Jacobo prefiere usuario y
contraseña. La ayudante recibe por WhatsApp un enlace con token de un solo uso y crea su propia contraseña.
Se usa el correo (no un "usuario" suelto) porque así funciona "Olvidé mi contraseña". Descartado: enlace mágico;
invitación por correo con la API de administración (exige `service_role`).

**D-015 · 2026-11-20 · Una sola app para celular y PC.** Mismo código y mismos datos; en PC hay menú lateral
y tablas. Descartado: app aparte de escritorio.

**D-016 · 2026-11-20 · Cómo se prueba.** Las pruebas de la base corren en un contenedor de Postgres
(`probar-sql.ps1` en Windows, `probar-sql.sh` en CI), nunca sobre la base de `supabase start`.
`supabase/tests/` queda solo para pgTAP; lo demás está en `supabase/pruebas/`. El usuario de Playwright se crea
solo en local y en CI, nunca en `seed.sql` (que se corre en producción).

**D-017 · 2026-11-20 · Conciliar con el extracto del banco (Fase 4b), siempre con confirmación.** Bancolombia y
Nequi en `.xlsx`/`.csv`. El portal propone; el gerente confirma. Es la misma lógica del conciliador
Bold/Redeban de Jacobo, cero costo y sin permisos de terceros. Descartado: registrar pagos sin confirmación.

**D-018 · 2026-11-20 · Pagos que se marcan solos, en la fase 5 y con la SAS constituida.** Opciones: enlaces de
pago con aviso automático, o conexión al banco por open finance (el Decreto 0368 de 2026 lo hizo obligatorio
en Colombia, pero los intermediarios piden contrato y cobran). Descartado por ahora: integrarlo en las fases 1–4b.

**D-019 · 2026-11-20 · Tutorial guiado desde la fase 1.** Onboarding, walkthrough, product tours, coach marks,
tooltips y hotspots (DESIGN.md). El avance se guarda por usuario en `recorridos_vistos`. Cada fase agrega los
pasos de sus pantallas. Objetivo: una ayudante nueva lo usa sin que Jacobo le explique.

**D-020 · 2026-11-20 · Cómo va la marca de Mamut en el portal.** Mientras sea la herramienta interna de Mamut,
Mamut es el protagonista: logo horizontal en `/entrar`, símbolo en el menú, sello apilado en `/ajustes/acerca`.
El ámbar se usa para una sola cosa por pantalla (el botón "Anotar visita"). Si en la fase 5 el portal recibe nombre
comercial, ese nombre lleva la marca y Mamut queda como firma "Un producto de Mamut Herd", como dice la guía.
