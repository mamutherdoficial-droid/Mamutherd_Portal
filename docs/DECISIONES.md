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

**D-021 · 2026-11-20 · "Olvidé mi contraseña" se pide desde el navegador y el enlace se abre en el mismo dispositivo.**
Supabase usa PKCE: el código del correo solo se puede cambiar por una sesión en el navegador que lo pidió.
Así `/entrar/nueva-clave` funciona con las Redirect URLs que ya pedía COMO-EMPEZAR, sin rutas extra ni cambiar
las plantillas de correo. Si se abre en otro dispositivo, la página lo explica y pide otro enlace.
Descartado: ruta `/auth/confirmar` en el servidor (otra Redirect URL que configurar); enlace con `token_hash`
(exige editar la plantilla del correo en Supabase).

**D-022 · 2026-11-20 · Versiones de la Fase 0.** Next.js 16.4 (App Router, `proxy.ts`), React 19.3, Tailwind 4.3,
Zod 4, Vitest 5, Playwright 1.65, Supabase CLI 3.2, ESLint 9 y **TypeScript 6.0**. No TypeScript 7: recién salido y
`typescript-eslint` (que usa `eslint-config-next`) solo soporta hasta 6.0. No ESLint 10 por la misma razón.
Se sube cuando las herramientas lo soporten. Versiones exactas en `package.json`.

**D-023 · 2026-11-20 · Sin Docker en el PC de Jacobo: pruebas contra la base de la nube (temporal).**
Excepción a D-013/D-016 que Jacobo autorizó mientras el proyecto no tiene datos reales:
- Pruebas de la base: `supabase/pruebas/base_test.sql` se corre contra la nube **dentro de `begin … rollback`**:
  prueba el Supabase de verdad (auth, roles, permisos de `anon`) sin dejar datos. El CI la corre en un Postgres limpio.
- e2e: Playwright crea un usuario de prueba con la secret key (solo en `.env.test.local`, que no se sube) y lo vuelve
  gerente de una empresa aparte, **"Pruebas e2e"** (`pruebas-e2e`), para no tocar los datos de Mamut.
- La app sigue sin usar la secret key (SEGURIDAD.md).
Cuando haya Docker: volver a `probar-sql.ps1` y `supabase start`, y borrar la empresa `pruebas-e2e` de la nube.
Descartado: Postgres portátil en el PC (el permiso para ejecutar binarios descargados se negó).

**D-024 · 2026-11-20 · Las secciones que aún no existen se muestran como "Pronto".** El menú y la barra inferior
muestran desde ya todas las secciones del rol, deshabilitadas con "Pronto" hasta su fase (`lib/navegacion.ts` →
`fase`). Así la ayudante y el gerente ven hacia dónde va el portal y no hay enlaces a páginas 404.
"Más" (celular) lista lo que no cabe en la barra. Descartado: ocultarlas; enlaces que dan 404.

**D-025 · 2026-11-20 · Variables públicas en Vercel como "Config"; la app acepta los dos nombres de la llave.**
`NEXT_PUBLIC_SUPABASE_URL` y la llave publishable van al navegador por diseño (las protege RLS), así que en Vercel
son tipo Config, no Secret. La app lee `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Las páginas que usan la sesión se arman al pedirlas, no al compilar: el build no necesita llaves.

**D-026 · 2026-11-20 · Logos que cambian con el tema y tamaños del ícono.** Cada logo va en `<picture>` con la
versión `para-fondo-oscuro` bajo `prefers-color-scheme: dark` (`components/marca/Logo.tsx`). El ícono de la PWA son
copias de `perfil-oscuro.png` redimensionadas a 192, 512 y 180 px (`public/marca/`, `app/apple-icon.png`);
el favicon es `m-para-fondo-claro.svg` tal cual. `docs/mamut-herd/` no se tocó.

**D-027 · 2026-11-20 · Las migraciones conservan el número de fecha al inicio.** El CLI de Supabase lo exige
(`AAAAMMDDHHMMSS_nombre.sql`): ordena las migraciones y registra cuáles ya se aplicaron en la nube. Lo legible va
después del número (`…_anotar_visita.sql`). Descartado: renombrarlas (la nube ya las tiene registradas con ese número).

**D-028 · 2026-11-20 · El gerente se vincula por correo, no por UID.** COMO-EMPEZAR 6.5 usa
`(select id from auth.users where email = …)`: menos pasos y sin copiar UIDs. Jacobo entra con el usuario que creó
en Supabase (su correo personal); se puede cambiar al correo de Mamut cuando quiera.

**D-029 · 2026-11-20 · App Android con Capacitor que abre el portal publicado.** El launcher de Jacobo no muestra
los accesos que crea Chrome ("Agregar a pantalla de inicio"), así que el portal también se entrega como APK.
- Capacitor 8 con `server.url` = `https://portalmamutherd.vercel.app/hoy`: la app es una ventana al portal publicado;
  lo que se publica en Vercel llega solo, sin reinstalar. Sin internet muestra `capacitor-www/sin-conexion.html`.
- Botón/gesto atrás (`components/app/BotonAtras.tsx`, plugin `@capacitor/app`): cierra la hoja abierta; si no,
  vuelve a la pantalla anterior del portal; en `/hoy` o `/entrar` minimiza la app (no la cierra). En el navegador no hace nada.
- Identificador `com.mamutherd.portal`, nombre "Portal Mamut", ícono y splash desde `perfil-oscuro.png`.
- Se arma con `scripts/apk.ps1`: Java de Android Studio (25), Gradle 9.2 (la 8.14 del proyecto no corre en Java 25
  y Capacitor 8 pide Java 21+), caché en `D:\.gradle`. Todo en D, nada en C.
- Firma de prueba (debug) por ahora. Para Play Store se crea una llave nueva solo de Mamut; no se reutiliza la de Impromptu.
- "Olvidé mi contraseña" se hace desde Chrome: el enlace del correo abre el navegador, no la app (D-021).
Descartado: TWA/Bubblewrap (menos control del botón atrás); app nativa aparte (duplicaría el portal).

**D-030 · 2026-11-20 · Fase 1 empezó antes de cerrar la Fase 0, por pedido de Jacobo.** La Fase 0 quedó publicada y
probada (pruebas en verde); solo faltaba su prueba en el celular. Jacobo pidió seguir. Las dos pruebas en el celular
(Fase 0 y Fase 1) se hacen juntas. Excepción a la regla "no se empieza una fase sin cerrar la anterior" del PLAN.

**D-031 · 2026-11-20 · Cómo se comporta "Anotar visita" (`anotar_visita`).**
- Busca el negocio por nombre sin importar mayúsculas antes de crear uno nuevo (evita duplicados tipo "Café luna").
- Reutiliza la oportunidad **abierta** del mismo producto; si la última está ganada o perdida, abre otra.
- La etapa **solo avanza**: interesado/volver → contactado, pidió propuesta → propuesta; nunca retrocede.
  "No le interesa" la cierra como perdida y la nota es el motivo (o "No le interesa").
- Si una ayudante visita un negocio cuya venta lleva otra persona, la actividad queda registrada pero la venta no
  se mueve (RLS: solo quien la lleva o un gerente).
Descartado: elegir etapa a mano en el formulario (más toques; la meta es < 20 s).

**D-032 · 2026-11-20 · Tutorial guiado con componente propio.** Coach marks, burbujas y bienvenida en
`components/recorrido/` (sin driver.js): son pocas piezas, se ven con los tokens de Mamut y respetan
`prefers-reduced-motion`. Dentro de "Anotar visita" el walkthrough se muestra **en el mismo formulario** (paso
"n de 5" y borde ámbar en el campo), porque la hoja es un `<dialog>` y nada puede taparlo desde afuera.
"Hacer el recorrido otra vez" borra las filas de `recorridos_vistos` del usuario (son preferencias, no datos de negocio).
Saltar la bienvenida también salta la primera visita guiada.

**D-033 · 2026-11-20 · Hoy muestra también los próximos 7 días.** Además de vencidos y de hoy, "Próximos 7 días":
así una visita con "Mañana" se ve enseguida con su fecha. Y una línea con las visitas de la semana (y cuántas con el
dueño) mientras llegan las metas de la Fase 4.

**D-034 · 2026-11-20 · Quitar un vendedor de una venta solo si aún no tiene comisiones.** `oportunidad_vendedores` es
una relación, no un dato de negocio, y se puede corregir; pero si esa persona ya tiene comisiones por la venta, se
niega (las comisiones dependen de esa fila). "Ganada" no se ofrece en "Pasar a…": la marca el gerente con el pago (Fase 2).

**D-035 · 2026-11-20 · Fases 2 a 4 de corrido.** Jacobo aprobó el plan de la Fase 2 y pidió seguir con todas las
fases posibles sin parar entre una y otra (no puede avanzar en Nef por ahora). Cada fase se cierra igual: `/verificar`
en verde, BITACORA y push. Las pruebas en el celular se acumulan y Jacobo las hace al final. Jacobo pidió
explícitamente seguir también con la Fase 5 si se llega, sin esperar su aprobación entre fases.

**D-036 · 2026-11-20 · `/equipo` sencillo llega en la Fase 2.** Sin la lista no hay cómo llegar a `/equipo/[id]`
(comisiones y pagos a ayudantes). Invitaciones y tareas siguen en la Fase 3.

**D-037 · 2026-11-20 · La ayudante puede leer la `base` de sus comisiones por API.** No se muestra en la app. No se
tapa porque se deduce de su comisión y su porcentaje; nunca ve cobros, saldos ni pagos.

**D-038 · 2026-11-20 · "Ganada" en una sola función (`ganar_oportunidad`).** Marca ganada, crea el cobro de
instalación, la suscripción y el pago del anticipo en una transacción; el pago va de último para que los vendedores
ya estén y el trigger cree sus comisiones. Solo gerente.
