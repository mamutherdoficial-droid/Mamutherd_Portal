# Bitácora

La entrada más nueva va arriba. Formato:

```
## AAAA-MM-DD · Fase N · título corto
Hecho:
- …
Probado:
- comandos corridos y resultado
Falta:
- …
Para que Jacobo pruebe:
- pasos concretos en el celular
Dudas:
- …
```

## 2026-11-23 · Fase 1b · Mapa de clientes y ruta del día · CERRADA EN CÓDIGO
`/verificar`: lint, tipos, Vitest (62), e2e (todas en verde; 3 saltadas a propósito), pruebas SQL (166 asserts en la nube),
RLS en las 24 tablas, `anon` sin permisos, `pnpm audit` sin vulnerabilidades, `ORS_API_KEY` en 0 archivos del navegador,
MapLibre en archivos aparte (next/dynamic) que solo bajan en el mapa y la ruta.
Hecho (a partir del paquete `mamut-portal-mapa.zip` de Jacobo):
- Migración `20261230000000_mapa_rutas.sql` (renombrada: la fecha original chocaba con `anotar_visita`) y su prueba
  `supabase/pruebas/mapa_test.sql`. `lib/dominio/ruta.ts` y su prueba (solo `!` por el TypeScript estricto).
- `maplibre-gl` 6.16.0 (la 5.x tiene una vulnerabilidad crítica, D-044) con OpenFreeMap; pines en gota con los colores de Mamut.
- `/ruta`: mapa + hoja con "X de N visitas", km y minutos (openrouteservice por las calles o "Línea aproximada"),
  **Siguiente** con **Ir** (Google Maps), **Ordenar por cercanía** desde el GPS, **Anota la visita** (la base marca la
  parada sola), subir/bajar, Saltar, Quitar y "Abrir en Google Maps" en tramos. "Arma tu ruta" si no hay.
- **Pegar lugares** (D-048, pedido de Jacobo): una línea por negocio con enlace de Maps, coordenadas o dirección.
- `/ventas?vista=mapa`: pines por etapa, tarjeta con WhatsApp y "Agregar a la ruta de hoy".
- Ficha del cliente: ubicación, "Estoy aquí", "Pegar enlace de Google Maps" y "Agregar a la ruta de hoy".
- Anotar visita: "Estoy en el negocio" (GPS; nunca pisa una ubicación guardada; nunca guarda dónde está la persona, D-046).
- Hoy: tarjeta "Tu ruta de hoy" / "Arma tu ruta". Menú: Ruta. Tutorial: tour de la ruta.
- Arreglo (D-049): Hoy se salía del ancho en el celular; prueba nueva `ancho.spec.ts`.
- Prueba SQL de la Fase 2 que dependía de la fecha (meta de la semana ya sembrada), corregida.
No hecho del PLAN 1b: "Nuevo negocio aquí" manteniendo presionado el mapa y mover el pin a mano en la ficha (hoy se ubica
con GPS o enlace); quedan para después.
Para Jacobo:
- Vercel → Settings → Environment Variables: `ORS_API_KEY` con la misma llave de `.env.local` (sin `NEXT_PUBLIC_`).
- Prueba en la calle (docs/PLAN.md · Fase 1b): anotar una visita con "Estoy en el negocio" y ver el pin; armar la ruta
  de mañana con 5 negocios (o pegarlos), ordenarla y tocar "Ir" en el primero.

## 2026-11-21 · Fase 5 (parte construible) · Producto para otros gerentes · CERRADA EN CÓDIGO
`/verificar`: lint, tipos, Vitest (48), e2e (82 en verde, 2 saltadas a propósito), pruebas SQL (149 asserts en la nube),
RLS en las 22 tablas, `anon` sin permisos, sin llaves en el código, `pnpm audit` sin vulnerabilidades.
Hecho:
- Migración `20261228000000_producto.sql`: `crear_empresa` (empresa + gerente; slug sin tildes y único; máximo 3 por
  cuenta) y `exportaciones` (registro de cada exportación, solo gerente). Prueba `fase5_test.sql`.
- `/registro`: crear cuenta y empresa con plantilla (Servicio con mensualidad, Venta por proyecto, En blanco).
  **Cerrado por defecto** (D-042); un gerente existente crea otra empresa desde Ajustes.
- Selector de empresa en Ajustes (cookie `empresa_activa`; si no pertenece, usa la primera).
- Clientes: importar desde .csv (no duplica por nombre) y exportar .csv con registro (Ley 1581).
- Portada pública en `/` (sin sesión): portada, 5 pasos interactivos, la semana, qué ve cada rol, comisiones con un
  ejemplo, cada vez más automático, preguntas frecuentes y Entrar. Sin testimonios ni cifras inventadas.
  Con sesión, `/` lleva a Hoy. Los 5 pasos salen de `lib/guia.ts` (los mismos de la Guía).
No hecho (D-043): planes y cobro del portal, nombre comercial, pagos automáticos, unión con Tino.
Para Jacobo:
- En Supabase → Authentication → URL Configuration, agregar `/registro` a Redirect URLs (junto a `/unirme`).
- Cuando quiera abrir el registro: Vercel → Settings → Environment Variables → `REGISTRO_ABIERTO` = `si` y redeploy.

## 2026-11-21 · Fase 4b · Subir extracto y conciliar · CERRADA
`/verificar`: lint, tipos, Vitest (43), e2e (70 en verde, 2 saltadas a propósito), pruebas SQL (135 asserts en la nube),
RLS en las 21 tablas, `anon` sin permisos, `pnpm audit` sin vulnerabilidades.
Hecho:
- Migración `20261221000000_conciliar.sql`: `extractos` y `movimientos_banco` (solo ingresos, huella única por empresa,
  estado propuesto/confirmado/descartado), RLS solo gerente, y `confirmar_movimiento` (crea el pago → el trigger crea las
  comisiones; una sola vez; no deja pasar del saldo). Prueba `fase4b_test.sql`.
- `lib/dominio/extractos/`: lector de CSV y .xlsx de Bancolombia y Nequi por títulos (D-040), montos y fechas
  colombianas, huellas; propuestas "Coincide valor y nombre / Mismo valor, revisa el nombre / Sin coincidencia".
  Vitest con ejemplos inventados en `tests/fixtures/extractos/`.
- Panel **Conciliar con el banco**: al lado de la tabla en PC y en `/cobros/conciliar` en el celular. Subir extracto
  (con Hotspot), Confirmar, No es este (elegir otro, D-041) e Ignorar. "Esos movimientos ya estaban" si se repite.
- `read-excel-file` + `serverExternalPackages` (D-039).
Para que Jacobo pruebe (en el PC, con las demás al final): los 3 pasos de la Fase 4b en `docs/PLAN.md`. Si el extracto
real no se lee, mandarlo (o una copia con los datos cambiados) para ajustar el lector.

## 2026-11-21 · Fase 4 · Inventario, metas, Hoy completo y resumen del domingo · CERRADA
`/verificar`: lint, tipos, Vitest (31), e2e (63 en verde, 1 saltada a propósito), pruebas SQL (123 asserts en la nube),
RLS en las 19 tablas, `anon` sin permisos, `pnpm audit` limpio. `/semana`: 250–307 ms la página; `resumen_semana` 3,3 ms
con 500 actividades (criterio: < 1 s).
Hecho:
- Migración `20261214000000_inventario_metas.sql`: `guardar_meta` (crea o actualiza sin duplicar; solo gerente; la semana
  empieza el lunes), `resumen_semana` (todo el domingo en una consulta) e índices. Prueba `fase4_test.sql`.
- `/inventario` (gerente): stock con alerta, Compra (con costo), Daño, Ajuste y **Registrar instalación** que propone
  −7 stickers, −6 soportes y −1 placa y el cliente ganado más reciente. Movimientos recientes.
- `/metas`: avance de la semana (barras), Poner metas (esta semana o la siguiente; empresa o persona), semanas
  anteriores con "Cumplida / No cumplida".
- `/hoy` completo: tablero de dos columnas en PC con seguimientos, meta de la semana, plata (por cobrar, vencido,
  por pagar al equipo), stock bajo y mis tareas.
- `/semana` (gerente): visitas, dueños y clientes contra la meta; plata; objeciones más repetidas (4 semanas); metas;
  stock bajo; semanas anteriores y siguientes.
- Tutorial: tours de Inventario, Metas y Semana. Guía: el paso 5 ya apunta a "Resumen de la semana".
- Formularios por ítem y asistentes se montan solo al abrirse (antes había uno escondido por tarjeta).
Para que Jacobo pruebe (con las demás al final): los 3 pasos de la Fase 4 en `docs/PLAN.md`.
No incluye la Fase 4b (extractos del banco): queda como siguiente.

## 2026-11-21 · Fase 3 · Equipo, tareas y acceso de ayudantes · CERRADA
`/verificar`: lint, tipos, Vitest (28), e2e (55 en verde, 1 saltada a propósito), pruebas SQL (104 asserts en la nube),
RLS en las 19 tablas, `anon` sin permisos, sin `service_role` en la app, `pnpm audit` limpio.
Hecho:
- Migración `20261207000000_equipo.sql`: `miembros.correo`; tabla `invitaciones` (solo el hash sha256 del token, RLS de
  gerente); `crear_invitacion` (una invitación viva por persona) y `aceptar_invitacion` (security definer: valida sesión,
  token vigente y sin usar, persona sin cuenta); `hecha_en` también cuando el gerente marca una tarea (la ayudante no
  puede inventar la fecha). Prueba `supabase/pruebas/fase3_test.sql`: token usado dos veces, reemplazado, inventado,
  vencido y de otra empresa → error.
- `/equipo`: Agregar persona (nombre, WhatsApp, correo, rol, forma de pago) y "sin acceso al portal".
  `/equipo/[id]`: Invitar (enlace de un solo uso, 7 días, listo para WhatsApp o copiar), sus tareas y los Acuerdos
  (forma de pago y reglas de comisión).
- `/unirme?token=…`: crear cuenta con su contraseña o "Ya tengo cuenta"; si Supabase pide confirmar el correo, el enlace
  del correo vuelve a `/unirme` y termina. Errores de Supabase traducidos a español.
- `/tareas` (gerente: todas y Nueva tarea con valor del trabajo; ayudante: Mis tareas) con marcar hecha y cancelar.
- La ayudante que abre `/cobros` o `/equipo` vuelve a `/hoy`.
- Tutorial: bienvenida de ayudante v2 (qué ve, cómo gana, primera visita), tours de Equipo v2, Tareas y Mis tareas.
  Vitest: ningún recorrido de la ayudante menciona cobros; máximo 5 pasos y 15 palabras.
- e2e: cuenta "+invitada" para probar la invitación de punta a punta (se desvincula antes de cada corrida).
Pendiente de configurar (Jacobo, en Supabase → Authentication → URL Configuration): agregar `/unirme` en Redirect URLs
(docs/SEGURIDAD.md) para el caso en que se pida confirmar el correo.
Para que Jacobo pruebe (con las demás al final): los 4 pasos de la Fase 3 en `docs/PLAN.md`.

## 2026-11-21 · Fase 2 · Cobros, mensualidades y comisiones · CERRADA
`/verificar`: lint, tipos, Vitest (24), e2e (48/48, celular y PC), pruebas SQL (80 asserts en la nube, base + Fases 1 y 2),
RLS en las 18 tablas, `anon` sin permisos, sin llaves en el código, `pnpm audit` limpio, ninguna comisión desde la app.
Hecho:
- Migración `20261130000000_cobros.sql`: trigger `cerrada_en` (respeta una fecha dada a mano), motivo de pérdida no vacío,
  `comisiones.ajustada_en` y `ganar_oportunidad` (D-038). Prueba `supabase/pruebas/fase2_test.sql`.
- Asistente **Ganada** (gerente) en la tarjeta de venta: vendedores → instalación → mensualidad → anticipo del 50%.
  Solo existe mientras está abierto.
- `/cobros`: pestañas Por cobrar · Vencidos · Pagados; tabla en PC; Registrar pago (no deja pagar más que el saldo ni con
  fecha futura); ver y anular pagos con confirmación; recordatorio por WhatsApp con el saldo; Generar mensualidades
  (dice "Ya estaban creadas" o "No hay planes mensuales activos").
- `/equipo` (D-036) y `/equipo/[id]`: le debemos / ya le pagamos, elegir qué se paga y marcar con fecha y medio,
  alerta "Descuenta del próximo pago" con "Ya lo descontó".
- `/mis-comisiones` (ayudante) y saldo en la ficha del cliente (solo gerente).
- Tutorial: tours de Cobros, Equipo y Mis comisiones; **Hotspot** en "Generar mensualidades" (componente nuevo).
- e2e: ayudante de prueba (correo con `+ayudante`), planes y reglas en la empresa "pruebas-e2e".
Notas de las pruebas:
- El emulador de celular de Playwright a veces deja la vista corrida y "tapa" botones en corridas largas. En la página
  medida no hay nada más ancho que la pantalla; en la Fase 2 dos botones se activan con teclado (la Fase 1 ya prueba el toque).
Para que Jacobo pruebe (con las demás al final):
- Los 5 pasos de "Prueba en el celular" de la Fase 2 en `docs/PLAN.md`.

## 2026-11-20 · Fase 1 · Clientes, ventas, Anotar visita y tutorial · CERRADA
`/verificar`: lint, tipos, Vitest (20), e2e (40/40), RLS en las 18 tablas, `anon` sin permisos, sin llaves en el código,
`pnpm audit` limpio, sin dinero en decimales ni comisiones desde la app; pruebas SQL otra vez en verde en la nube.
Jacobo probó Fases 0 y 1 en el celular: OK.
Hecho:
- Migraciones `20261123000000_anotar_visita.sql` (función en una transacción, D-031) y
  `20261123000100_recorridos_vistos.sql` (RLS: cada quien lo suyo). Aplicadas en la nube.
- Pruebas SQL `supabase/pruebas/fase1_test.sql`; `probar-sql.sh` corre todos los `*_test.sql`.
- `/hoy` v1 (vencidos, de hoy, próximos 7 días, visitas de la semana; D-033), hoja **Anotar visita** con botón ámbar,
  `/ventas` por etapa con filtros, "Pasar a…", "Perdida" con motivo y seguimiento editable, `/clientes` con buscador,
  `/clientes/[id]` (datos, editar, ventas, vendedores para el gerente, historial), WhatsApp con mensaje editable,
  `/guia` con los 5 pasos y "Hacer el recorrido otra vez".
- Tutorial guiado propio (D-032): bienvenida (gerente y ayudante), primera visita guiada, product tour de Ventas.
- Vitest: etapas, WhatsApp y fechas de seguimiento (20 pruebas en verde).
Probado:
- Pruebas SQL de base + Fase 1 contra la nube en `begin … rollback`: en verde.
- `pnpm typecheck` y `pnpm lint`: sin errores. `pnpm build`: OK.
- e2e contra `pnpm start`: **40/40 en verde** (celular y PC). Anotar visita: **6 toques, 1,1–1,3 s** (meta: ≤ 6 y < 20 s).
  Arreglos que salieron de las pruebas:
  el resalte del tutorial medía el botón antes de que cargara la página; "Perdida" justo después de "Pasar a…"
  perdía el toque mientras la tarjeta se mudaba de grupo; la capa oscura del tutorial tapaba el botón resaltado
  (ahora deja pasar el toque por el hueco); dos pruebas estaban mal planteadas.
Falta:
- Endurecer en la próxima migración (Fase 2): `motivo_perdida` no vacío en la base (hoy la base exige que no sea
  null y la app exige 3 letras; un texto vacío por fuera de la app pasaría).
Para que Jacobo pruebe:
- Los 5 pasos de "Prueba en el celular" de la Fase 1 en `docs/PLAN.md`.

## 2026-11-20 · Fase 0 (extra) · App Android con Capacitor
Hecho:
- Capacitor 8 (`capacitor.config.ts`, carpeta `android/`) abriendo el portal publicado (D-029).
- Botón atrás de Android: cierra hojas, vuelve a la pantalla anterior, en /hoy o /entrar minimiza.
- Ícono adaptativo, ícono redondo y splash con el mamut (`perfil-oscuro.png`), fondo tinta. Pantalla "Sin conexión".
- `scripts/apk.ps1` para armar el APK con todo en D (Java de Android Studio, `D:\.gradle`, SDK en `D:\Android\sdk`).
- CI: el paso de tipos ahora genera antes los tipos de rutas de Next (`next typegen`); quedó en verde.
Probado:
- `pnpm typecheck` y `pnpm lint` sin errores con el código nuevo.
- APK: ver la entrada siguiente o el resumen de la sesión.
Falta:
- Instalar el APK en el celular de Jacobo y probar atrás, modo oscuro, cerrar sesión y sin conexión.
Para que Jacobo pruebe:
- Instala `app-debug.apk`, entra, navega Hoy → Más → Ajustes → Acerca de y usa atrás: vuelve paso a paso;
  en Hoy, atrás minimiza. Abre la app sin internet: sale "No hay conexión".

## 2026-11-20 · Fase 0 · Base, marca de Mamut, entrar y publicado
Hecho:
- Repo en GitHub (`mamutherdoficial-droid/Mamutherd_Portal`) con commits de la cuenta de Mamut; Git fijado a esa
  cuenta en este repo. El "Initial commit" de GitKraken nunca había llegado a GitHub: se subió todo desde aquí.
- App Next.js 16 + TypeScript estricto + Tailwind 4 con los tokens de DESIGN.md (claro y oscuro), Unbounded y Manrope
  locales (`app/fuentes/`), logos del kit en `public/marca/`, `lib/marca.ts` leyendo `mamut-herd.json`.
- `/entrar` (correo, contraseña con "Ver", errores que dicen qué hacer), "Olvidé mi contraseña" y `/entrar/nueva-clave` (D-021).
- `proxy.ts`: sin sesión, toda ruta de la app manda a `/entrar?siguiente=…`.
- Empresa activa: la primera a la que pertenece el usuario (`lib/sesion.ts`); si no tiene, pantalla "Tu usuario aún
  no está en ningún equipo".
- Layout: barra inferior (Hoy · Ventas · Cobros/Comisiones · Más) en celular, menú lateral desde 1024 px con nombre y
  rol; secciones futuras como "Pronto" (D-024). Páginas: `/hoy` vacío, `/mas`, `/ajustes`, `/ajustes/acerca` (sello
  apilado, texto y contacto), `/componentes` (claro y oscuro lado a lado).
- `components/ui`: Boton, Campo/CampoClave, Hoja, Chip/Estado, Tarjeta, Dinero, Vacio.
- PWA: manifest "Portal Mamut", íconos 192/512/180 desde `perfil-oscuro.png`, favicon `m` (D-026).
- `lib/dominio/dinero.ts` y `semanas.ts` con Vitest.
- Supabase: `supabase init` (CLI v3; contraseña mínima 8, redirect URLs locales). Migraciones y semilla aplicadas en
  la nube con `db push --remote --include-seed`. Tipos reales en `lib/supabase/tipos.ts` generados desde la nube.
- Vercel: `https://portalmamutherd.vercel.app` (preset Next.js, variables tipo Config, D-025).
- Jacobo vinculado como gerente de Mamut Herd (D-028). Ya entra desde la web.
- CI en GitHub Actions: lint, typecheck, Vitest, build y `bash scripts/probar-sql.sh`.
- COMO-EMPEZAR paso 6 actualizado (CLI v3, Vercel, vincular por correo). Decisiones D-021 a D-028.
Probado:
- `pnpm lint` y `pnpm typecheck`: sin errores. `pnpm test`: 10/10. `pnpm build`: OK, también sin llaves.
- `pnpm e2e`: 26/26 (móvil 390×844 y PC 1280×800). Incluye: sin sesión → /entrar, logo cambia con tema oscuro,
  entrar → /hoy vacío, barra inferior vs. menú lateral, /componentes, sello en Acerca de, cerrar sesión.
  Capturas en `tests/capturas/`.
- `base_test.sql` contra la base de la nube dentro de `begin … rollback` (D-023): todo en verde, incluido
  "anon no tiene permisos en tablas, vistas ni funciones" sobre el Supabase real. Se comprobó que no quedó nada.
Falta:
- Prueba en el celular de Jacobo (PLAN → Fase 0) y marcarla en SEGUIMIENTO.
- `probar-sql.ps1` no se corrió: no hay Docker en el PC (D-023). El CI lo cubre con `probar-sql.sh` (primera corrida pendiente de ver en verde).
- Playwright en el CI con `supabase start`: queda en local por ahora (lo permite el PLAN).
- Tutorial guiado: empieza en la Fase 1 (D-019); la Fase 0 no tiene recorridos.
- `pnpm audit` no se corrió aún.
Para que Jacobo pruebe:
- Los 6 pasos de "Prueba en el celular" de la Fase 0 en `docs/PLAN.md`.
Dudas:
- Ninguna de código. Seguridad: rotar la secret key y la contraseña de la base (pasaron por el chat) y volver
  privado el repo de GitHub (está público; COMO-EMPEZAR pedía privado). No hay llaves en el repo.

## 2026-11-20 · Kit v2 (revisión con Claude antes de la Fase 0)
Hecho:
- Pruebas de la base movidas a `supabase/pruebas/`; `supabase/tests/` queda para pgTAP.
- `scripts/probar-sql.ps1` para Windows (Docker) y `.gitattributes` (saltos de línea de Linux en .sh y .sql).
- Migración `20261120000100_permisos_por_defecto.sql` y prueba de que `anon` no tiene permisos.
- Docs: estética de Mamut (no Tino), tutorial guiado, celular y PC, correo y contraseña con invitaciones,
  un solo proyecto en la nube, Fase 4b (extracto del banco), pasos para Jacobo en COMO-EMPEZAR y SEGUIMIENTO.md.
- Decisiones D-011 a D-020.
- Kit de marca de Mamut Herd en `docs/mamut-herd/` y tokens reales en `DESIGN.md` (contraste revisado).
Probado:
- `bash scripts/probar-sql.sh` en Postgres 16: migraciones y semilla dos veces sin error; todas las pruebas en verde.
- `probar-sql.ps1` no se pudo correr fuera de Windows: Jacobo lo corre en el paso 2 de COMO-EMPEZAR.
Falta:
- Todo el código de la app (fase 0 en adelante).
Dudas:
- Ninguna.

## 2026-11-19 · Kit inicial
Hecho:
- Documentos del proyecto, migración base (empresas, miembros, catálogo, clientes, oportunidades, actividades,
  suscripciones, cobros, pagos, comisiones, tareas, inventario, metas), RLS, vistas y semilla de Mamut Herd.
Probado:
- `bash scripts/probar-sql.sh`: migración y semilla dos veces sin error; pruebas de comisiones (25% instalación,
  10% mensualidad con tope de 6 meses, anulación), RLS de gerente y ayudantes, mensualidades idempotentes,
  inventario y metas. Todo en verde (Postgres 16 local).
Falta:
- Todo el código de la app (fase 0 en adelante).
Dudas:
- Ninguna.
