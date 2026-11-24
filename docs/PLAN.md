# Plan por fases

Cada fase termina con: pruebas en verde, `/verificar`, entrada en `BITACORA.md` y un commit.
No se empieza una fase sin cerrar la anterior. **Se construye los lunes**; el resto de la semana se vende.
Excepción acordada: la Fase 0 se hace el fin de semana del 20 al 22 de noviembre de 2026.

| Fase | Qué deja | Cuándo |
| --- | --- | --- |
| 0 | Repo, estética de Mamut, entrar con contraseña, celular y PC, pruebas, CI y publicado en Vercel | Vie 20 – dom 22 nov 2026 |
| 1 | Clientes, ventas, "Anotar visita" y el tutorial guiado | Lun 23 nov |
| 2 | Cobros, mensualidades y comisiones | Lun 30 nov |
| 3 | Equipo, tareas y acceso de ayudantes con su contraseña | Lun 7 dic |
| 4 | Inventario, metas, "Hoy" completo y resumen del domingo | Lun 14 dic |
| 4b | Subir el extracto del banco y conciliar | Lun 21 dic |
| 5 | Producto para otros gerentes | Solo si pasa la puerta de la fase 5 (enero 2027 o después) |

Si una fase no cabe en su lunes, lo que falte se anota en `BITACORA.md` y abre el lunes siguiente
**antes** de empezar la fase nueva. Nunca se empiezan dos fases a la vez.

Cada pantalla nueva llega con su parte del **tutorial guiado** (docs/DESIGN.md → "Tutorial guiado").

---

## Fase 0 — Base

**Construir**
- **Marca de Mamut** (D-011, D-020): lee `docs/mamut-herd/` completo (empieza por `GUIA-DE-USO.md`). Tokens de
  `DESIGN.md` → "Marca y tokens" en `app/globals.css` y Tailwind; fuentes locales (Unbounded, Manrope);
  logos tal cual en `public/marca/`; `lib/marca.ts` desde `mamut-herd.json`; `/ajustes/acerca` con el sello apilado.
  No modifiques nada dentro de `docs/mamut-herd/`.
- Next.js estable (App Router, TypeScript estricto; en Next 16 la protección de rutas va en `proxy.ts`),
  Tailwind con los tokens, Lucide, Zod, pnpm, ESLint directo (ya no existe `next lint`).
- CLI de Supabase como dependencia de desarrollo (`pnpm add -D supabase`, se usa con `pnpm exec supabase`).
  `supabase init` y `supabase start`; `supabase db reset` aplica las migraciones y la semilla que ya existen.
- `lib/supabase/server.ts` y `browser.ts` con `@supabase/ssr`; tipos generados en `lib/supabase/tipos.ts`.
- `/entrar` con correo y contraseña (D-014), "Olvidé mi contraseña" y `/entrar/nueva-clave` para crear otra.
  `proxy.ts` manda a `/entrar` cualquier ruta de `(app)` sin sesión.
- Empresa activa: si el usuario pertenece a una sola empresa, se usa esa (selector en fase 5).
- Layout de una sola app para celular y PC (D-015): barra inferior en celular, menú lateral desde 1024 px.
  Página `/componentes` con todos los componentes de `components/ui` en claro y oscuro.
- PWA básica: `manifest`, ícono desde `perfil-oscuro.png`, favicon `m`, nombre "Portal Mamut", para "Agregar a pantalla de inicio".
- `lib/dominio/dinero.ts` (formato COP) y `semanas.ts` (lunes a domingo, hora Bogotá) con pruebas Vitest.
- Playwright: entrar → ver `/hoy` vacío en 390×844, y en 1280×800 ver el menú lateral.
  El usuario de prueba se crea solo en local y en CI, nunca en `supabase/seed.sql` (D-016).
- CI en GitHub Actions: lint, typecheck, Vitest, `bash scripts/probar-sql.sh` y Playwright.
  Si Playwright en CI con `supabase start` se complica, déjalo corriendo en local, anótalo como pendiente
  en BITACORA y sigue: lo demás del CI es obligatorio.
- Al final, revisa que los pasos de "Después de la Fase 0" en `COMO-EMPEZAR.md` sirvan tal cual
  (nube, Vercel, vincular gerente) y corrígelos si algo cambió. Tú no necesitas llaves de producción.

**Criterios**
- [ ] `scripts/probar-sql.ps1` pasa en el PC de Jacobo y `bash scripts/probar-sql.sh` pasa en CI.
- [ ] Contra la base de `supabase start`, `anon` no tiene permisos en tablas, vistas ni funciones de `public`.
- [ ] Sin sesión, cualquier ruta de `(app)` manda a `/entrar`.
- [ ] `/componentes` muestra botones, campos, hoja inferior, chips, tarjeta, monto y estado vacío en claro y
      oscuro, **con los tokens de Mamut** (Unbounded solo en títulos, Manrope en lo demás).
- [ ] Los logos cambian con el tema (versión para fondo claro u oscuro) y `/ajustes/acerca` muestra el sello apilado.
- [ ] `formatearPesos(200000)` → `$ 200.000` o `$200.000` (el que dé `es-CO`), probado.
- [ ] Jacobo abre la URL de Vercel en su celular y entra con su correo y contraseña.

**Prueba en el celular (Jacobo)**
1. Abre la URL de Vercel: ves el logo de Mamut Herd. Entra con tu correo y contraseña: "Hoy" vacío en tinta y hielo.
2. Menú del navegador → "Agregar a pantalla de inicio": queda el ícono del mamut.
3. Pon el celular en modo oscuro: el portal y el logo cambian solos.
4. Cierra sesión y abre `/hoy`: te manda a "Entrar".
5. "Olvidé mi contraseña": te llega el correo y puedes crear otra.
6. En el PC, abre la misma URL: ves el menú lateral.

**Prompt**: el de `COMO-EMPEZAR.md` (paso 5).

---

## Fase 1 — Ventas en el celular + tutorial guiado

**Construir** (en este orden; si el lunes no alcanza, lo último pasa al lunes siguiente)
1. `/hoy` (versión 1): seguimientos vencidos y de hoy + botón "Anotar visita".
2. Hoja **Anotar visita** (ver `DESIGN.md`): una Server Action que crea o reutiliza cliente, crea o actualiza la
   oportunidad del producto y registra la actividad, todo en una transacción (función SQL `anotar_visita` nueva,
   `security invoker`, con prueba).
3. `/clientes` (buscador) y `/clientes/[id]` (datos, oportunidades, actividades, editar).
4. `/ventas` agrupado por etapa, con filtros; cambiar etapa desde la tarjeta; `perdida` pide motivo.
5. Botón WhatsApp en cada seguimiento (`lib/dominio/whatsapp.ts`, mensaje editable antes de abrir).
6. Asignar vendedores a una oportunidad (gerente): atribución y parte.
7. **Tutorial guiado, base:** tabla `recorridos_vistos` con RLS y prueba; componente de recorrido
   (coach marks + tooltips) y `lib/recorridos.ts`; **Onboarding** de bienvenida para el gerente;
   **Interactive Walkthrough** "Anota tu primera visita"; **Product Tour** de Ventas; `/guia` con los 5 pasos
   y "Hacer el recorrido otra vez".

**Criterios**
- [ ] Anotar una visita a un negocio nuevo toma ≤ 6 toques y < 20 s en Playwright móvil.
- [ ] Una visita sin próxima fecha muestra aviso, pero se puede guardar.
- [ ] Una oportunidad no se puede marcar `perdida` sin motivo (UI y base).
- [ ] e2e: anotar 3 visitas → aparecen en `/ventas` y en los seguimientos de `/hoy` con la fecha correcta.
- [ ] e2e: el primer ingreso muestra la bienvenida; "Saltar" la cierra y no vuelve a salir;
      `/guia` → "Hacer el recorrido otra vez" la repite.
- [ ] Prueba SQL: un usuario no ve ni cambia los recorridos de otro.

**Prueba en el celular (Jacobo)**
1. Entra: aparece la bienvenida y el recorrido te lleva a anotar tu primera visita real.
2. Anota 3 visitas reales de la semana en la calle, cronometrando: menos de 20 s cada una.
3. Mira que aparezcan en "Hoy" el día que elegiste y que el botón de WhatsApp abra el chat con el mensaje.
4. Pasa una venta de etapa y marca otra como perdida (te pide el motivo).
5. Cierra sesión y entra otra vez: el tutorial ya no aparece.

**Prompt**
```
Lee CLAUDE.md, docs/DESIGN.md (Hoy, Anotar visita, Tutorial guiado) y docs/MODELO-DATOS.md.
Ejecuta la Fase 1 de docs/PLAN.md en el orden que dice. Prioridad: que anotar una visita en el celular
sea rapidísimo. Si no alcanza el tiempo, el tutorial queda de último y lo anotas en BITACORA.
Plan primero; al terminar /verificar y BITACORA.
```

---

## Fase 2 — Cobros, mensualidades y comisiones

**Construir**
- Migración: trigger que llena `oportunidades.cerrada_en` cuando la etapa pasa a `ganada` o `perdida`
  (y lo limpia si se reabre), con prueba. Sin esto la meta "clientes nuevos" no sube.
- Al marcar una oportunidad `ganada`: asistente que **primero confirma los vendedores y su atribución**
  (si se agregan después del primer pago, ese pago no genera comisión), luego crea el cobro de instalación
  (plan y precio, con opción fundador), la suscripción mensual (plan, precio congelado, día de cobro) y
  propone el anticipo del 50%.
- `/cobros`: Por cobrar, Vencidos, Pagados (desde `v_cobros`); en PC como tabla. **Registrar pago**;
  **Anular pago** (con confirmación); **Generar mensualidades del mes** (llama `generar_mensualidades`);
  recordatorio por WhatsApp.
- `/equipo/[id]` (gerente): comisiones pendientes y pagadas, trabajos por pagar (`v_por_pagar_ayudantes`),
  **Marcar como pagado** (fecha y medio), total a pagar.
- Alerta si se anula un pago cuya comisión ya estaba pagada.
- `/mis-comisiones` (ayudante).
- Tutorial: **Product Tour** de Cobros y **Hotspot** en "Generar mensualidades".

**Criterios**
- [ ] e2e: venta propia de Ana → anticipo $100.000 → Ana ve $25.000 pendientes → pago del resto → $50.000.
- [ ] Generar mensualidades dos veces en el mismo mes no duplica (UI muestra "Ya estaban creadas").
- [ ] La ficha del cliente muestra su saldo; una ayudante no ve montos de cobros en ningún lado.
- [ ] Ninguna comisión se crea desde la app (búsqueda en el código: no hay `insert` en `comisiones`).
- [ ] Prueba SQL: marcar `ganada` llena `cerrada_en` y la meta de clientes nuevos sube.

**Prueba en el celular (Jacobo)**
1. Marca como ganada una venta de prueba: el asistente te pide los vendedores antes del cobro.
2. Registra un anticipo de prueba y mira la comisión en `/equipo`.
3. Genera las mensualidades dos veces: la segunda dice "Ya estaban creadas".
4. Anula el pago de prueba: la comisión pendiente desaparece.
5. Abre Cobros en el PC: se ve como tabla.

**Prompt**
```
Lee CLAUDE.md y docs/MODELO-DATOS.md (Cobros, Comisiones). Ejecuta la Fase 2 de docs/PLAN.md.
Las comisiones las crea la base con el trigger: no las calcules en la app. Plan primero; al terminar /verificar y BITACORA.
```

---

## Fase 3 — Equipo, tareas y acceso de ayudantes

**Construir**
- `/equipo`: crear miembro (nombre, WhatsApp, correo, rol, forma de pago).
- **Invitación con contraseña** (D-014, sin `service_role`): el gerente toca "Invitar" y el portal crea un
  token de un solo uso (tabla `invitaciones`, vence en 7 días) y arma el enlace `/unirme?token=…` para
  mandarlo por WhatsApp. La ayudante abre el enlace, crea su cuenta con su correo y **su contraseña**
  (`supabase.auth.signUp`) y la función SQL `aceptar_invitacion(token)` vincula su `usuario_id`.
- `/tareas`: crear, asignar, vencer, marcar hecha; tipo `fotos` con `valor_trabajo` (pago por trabajo).
- Vista de ayudante: Hoy, Mis ventas, Mis comisiones, Mis tareas. Nada de cobros.
- Copia de los acuerdos: en `/equipo/[id]` se muestra la forma de pago y las reglas de comisión que aplican.
- Tutorial: **Onboarding** propio de la ayudante (qué ve, cómo gana, cómo anotar visitas) y Product Tour de Equipo.

**Criterios**
- [ ] Pruebas SQL de invitaciones: token usado dos veces → error; token vencido → error; token de otra empresa → error.
- [ ] e2e con dos usuarios: gerente asigna tarea de fotos → hermana la marca hecha → aparece en "Por pagar".
- [ ] Una ayudante no puede abrir `/cobros`, `/inventario` ni `/equipo` (redirige a `/hoy`).
- [ ] El recorrido de la ayudante no muestra ningún paso de cobros.

**Prueba en el celular (Jacobo)**
1. Invita a una amiga vendedora: el enlace sale listo para WhatsApp.
2. Ella crea su contraseña en su celular y ve su propio tutorial.
3. Desde su cuenta: no ve Cobros ni lo que ganan otros.
4. Asígnale una tarea a tu hermana; cuando la marque hecha, aparece en "Por pagar".

**Prompt**
```
Lee CLAUDE.md, docs/SEGURIDAD.md y docs/MODELO-DATOS.md (Trabajos). Ejecuta la Fase 3 de docs/PLAN.md.
Toda tabla o función nueva lleva RLS y prueba en supabase/pruebas/base_test.sql (o pgTAP en supabase/tests/).
No uses service_role. Plan primero; al terminar /verificar y BITACORA.
```

---

## Fase 4 — Inventario, metas y Hoy completo

**Construir**
- `/inventario`: stock (`v_inventario`), alerta de stock bajo, registrar compra (cantidad y costo total),
  daño y ajuste. Al cerrar una instalación, proponer los movimientos (stickers, soportes, placa) y el cliente.
- `/metas`: crear metas de la semana (empresa, por persona, por producto); avance (`v_avance_metas`);
  semanas anteriores en una lista con "cumplida / no cumplida".
- `/hoy` completo: barras de meta, por cobrar, por pagar al equipo, stock bajo (en PC, el tablero de dos columnas).
- Resumen del domingo: pantalla `/semana` con lo que pide la revisión del plan de ventas
  (visitas, dueños, clientes vs meta; objeciones más repetidas de `motivo_perdida`; vencidos; comisiones; stock).
- Tutorial: Product Tour de Inventario, Metas y `/semana`.

**Criterios**
- [ ] Comprar 50 stickers e instalar en un cliente con 7 → stock 43 y aviso si baja de 20.
- [ ] Una meta de visitas sube sola al anotar una visita (e2e).
- [ ] `/semana` carga en < 1 s con 500 actividades de prueba.

**Prueba en el celular (Jacobo)**
1. Registra la compra real de tags y soportes; instala en un cliente y mira el stock bajar.
2. Pon las metas de la semana siguiente.
3. El domingo abre `/semana` y haz tu revisión desde ahí.

**Prompt**
```
Lee CLAUDE.md, docs/DESIGN.md y docs/MODELO-DATOS.md (Inventario, Metas). Ejecuta la Fase 4 de docs/PLAN.md.
Plan primero; al terminar /verificar y BITACORA.
```

---

## Fase 4b — Subir extracto y conciliar (D-017)

**Construir**
- Tablas `extractos` (banco, archivo, subido_por, subido_en) y `movimientos_banco` (fecha, descripción,
  referencia, valor en pesos enteros, `huella` única por empresa, estado `propuesto | confirmado | descartado`,
  `cobro_id`, `pago_id`). Solo gerente (RLS) y pruebas.
- Lector de extractos de **Bancolombia** y **Nequi** en `.xlsx` y `.csv` (`lib/dominio/extractos/`), con pruebas
  Vitest usando archivos de ejemplo sin datos reales. Si Jacobo comparte la carpeta de su conciliador
  Bold/Redeban, reutiliza su lógica de lectura (léela sin modificarla).
- Propuesta de coincidencias: mismo valor que el saldo de un cobro pendiente y parecido del nombre
  ("coincide valor y nombre" / "mismo valor, revisa el nombre" / "sin coincidencia").
- Panel **"Conciliar con el banco"** en `/cobros` (al lado de la tabla en PC, pantalla aparte en celular):
  **Confirmar** crea el pago (y el trigger crea las comisiones); **No es este** y **Ignorar** lo descartan.
- **Nunca** se registra un pago sin que el gerente confirme. Subir el mismo extracto dos veces no duplica (huella).
- Tutorial: Hotspot en "Subir extracto".

**Criterios**
- [ ] Prueba SQL: confirmar un movimiento crea un pago y su comisión; confirmarlo otra vez no duplica.
- [ ] Vitest: cada formato de ejemplo se lee con fechas y valores correctos.
- [ ] e2e: subir el mismo archivo dos veces → "Esos movimientos ya estaban".

**Prueba en el PC (Jacobo)**
1. Descarga el extracto real de la semana de Bancolombia o Nequi y súbelo.
2. Revisa las propuestas: confirma las correctas y descarta las demás.
3. Mira que los cobros queden pagados y las comisiones aparezcan.

**Prompt**
```
Lee CLAUDE.md, docs/MODELO-DATOS.md (Cobros) y docs/SEGURIDAD.md. Ejecuta la Fase 4b de docs/PLAN.md.
Nada se registra sin confirmación del gerente. Plan primero; al terminar /verificar y BITACORA.
```

---

## Puerta de la fase 5

Se pasa a la fase 5 solo si se cumplen las tres:
1. Mamut usó el portal 4 semanas seguidas, todos los días de venta.
2. Jacobo no volvió a las notas del celular ni a calcular comisiones a mano.
3. Al menos 3 gerentes conocidos (otros negocios) dijeron que pagarían por algo así, después de verlo.

## Fase 5 — Producto para otros gerentes (borrador)

- Registro de empresa nueva (función SQL `crear_empresa` que crea empresa + gerente), selector de empresa.
- Plantillas de inicio por tipo de negocio (productos, planes y reglas de comisión de ejemplo) y su onboarding.
- Importar clientes desde CSV; exportar (solo gerente, queda registro).
- **Landing pública** con la estética de Mamut (DESIGN.md → "Landing pública"); si el portal recibe nombre
  comercial propio, Mamut queda como firma (D-020). Reemplazar `MAMUT_HERD_URL` cuando la web esté publicada.
- Planes y cobro del propio portal; nombre comercial definitivo (D-009).
- **Pagos que se marcan solos** (D-018), solo con Mamut Herd SAS constituida: enlaces de pago con aviso
  automático o conexión al banco por open finance.
- Unión con Tino en un solo proyecto de Supabase (ver ARQUITECTURA) si ya hay clientes que usen ambos.

## Fase 1b — Mapa y ruta del día

La base ya está lista: `supabase/migrations/20261230000000_mapa_rutas.sql` (ubicación de los negocios, `rutas`,
`ruta_paradas`, `reordenar_ruta`, `v_ruta_paradas` y el trigger que marca la parada al anotar la visita), con sus
pruebas en `supabase/pruebas/mapa_test.sql`. La lógica de orden y enlaces está en `lib/dominio/ruta.ts` con
`ruta.test.ts`. El aspecto a copiar está en `docs/referencias/ruta-prototipo.html` (ábrelo en el navegador).

> Llegó en el paquete del mapa (23 nov 2026), después de la Fase 5. Decisiones D-044 a D-048; colores con los tokens de Mamut.

**Construir**
- Dependencia: `maplibre-gl` (D-044), cargada con `next/dynamic` y `ssr: false` solo en `/ventas?vista=mapa` y `/ruta`.
  Mapa base de OpenFreeMap (`positron` en claro, `dark` en oscuro) con el toque de paleta del prototipo. La
  atribución de OpenStreetMap queda visible.
- **Ubicación del negocio** (D-046):
  - En la hoja **Anotar visita**, interruptor "Estoy en el negocio" (encendido por defecto si el negocio no tiene
    ubicación): guarda `lat`/`lng` con `navigator.geolocation`, `ubicacion_fuente = 'gps'`. Nunca pisa una ubicación ya
    guardada sin preguntar.
  - En la ficha del cliente: "Ubicar en el mapa" (mover un pin, `'mapa'`) o "Pegar enlace de Google Maps" (`'enlace'`,
    con `leerEnlaceMaps`; los enlaces cortos se resuelven en el servidor, ver ARQUITECTURA · Mapa).
- **Mapa de clientes**: en `/ventas`, selector **Lista | Mapa**. Pines por etapa (colores en DESIGN · Mapa), filtros
  de producto y "sin próxima fecha". Tocar un pin abre una tarjeta corta: nombre, etapa, próxima acción, WhatsApp y
  **"Agregar a la ruta de hoy"**. Mantener presionado el mapa: **"Nuevo negocio aquí"** (crea el cliente como prospecto).
- **Ruta del día** (`/ruta`, y `/ruta/[id]` para días anteriores):
  - Si no hay ruta para hoy, "Arma tu ruta": nombre (zona) y agregar negocios desde el mapa o el buscador.
  - Hoja inferior como el prototipo: "1 de 6 visitas", km y minutos, barra de avance, tarjeta **Siguiente** con
    botón **Ir** (`enlaceIrA`), botones **Ordenar por cercanía** (`ordenarPorCercania` desde tu ubicación o desde la
    última parada hecha, y `reordenar_ruta`) y **Anota la visita** (abre la hoja con el negocio ya elegido).
  - Lista de paradas: subir/bajar (o arrastrar en escritorio), **Saltar** (`estado = 'saltada'`) y **Quitar**
    (solo pendientes). "Abrir toda la ruta en Google Maps" con `tramosGoogleMaps` (tramos de 3 intermedios).
  - Línea por las calles: Server Action `calcularRuta(rutaId)` que llama a openrouteservice (`foot-walking`, D-045) y
    guarda `geometria`, `distancia_m` y `duracion_s`. Solo se recalcula cuando cambia el orden o las paradas. Si falla
    o no hay llave, línea recta + `estimarCaminata` y el texto "Línea aproximada".
- En `/hoy`: tarjeta **"Tu ruta de hoy"** (paradas, avance y km) que abre `/ruta`; si no hay, "Arma tu ruta".

**Criterios**
- [ ] `bash scripts/probar-sql.sh` pasa con `mapa_test.sql` (y su versión para Supabase en Windows).
- [ ] Vitest: `lib/dominio/ruta.test.ts` en verde.
- [ ] e2e móvil (Playwright con `context.setGeolocation`): anotar visita a un negocio nuevo con "Estoy en el negocio"
      → aparece como pin en el mapa de ventas.
- [ ] e2e: armar ruta con 4 negocios → "Ordenar por cercanía" no alarga el recorrido → anotar la visita del primero →
      la parada queda en verde y la tarjeta **Siguiente** pasa al segundo, sin recargar.
- [ ] Una ayudante solo ve sus rutas y solo agrega negocios que ve (lo prueba `mapa_test.sql`; la UI no muestra otros).
- [ ] `ORS_API_KEY` no aparece en el bundle del navegador (búsqueda en `.next/static`).
- [ ] `/ruta` carga en < 2,5 s con 4G simulado; el JS del mapa no se descarga en `/hoy` ni en `/cobros`.
- [ ] Claro y oscuro; con `prefers-reduced-motion` no hay animación de la línea ni del pin siguiente.

**Prompt**
```
Lee CLAUDE.md, docs/DESIGN.md (Mapa y Ruta), docs/ARQUITECTURA.md (Mapa), docs/MODELO-DATOS.md (Mapa y rutas),
docs/DECISIONES.md (D-044 a D-047) y abre docs/referencias/ruta-prototipo.html para copiar su aspecto.
Ejecuta la Fase 1b de docs/PLAN.md. La migración 20261230000000_mapa_rutas.sql, sus pruebas y lib/dominio/ruta.ts
ya existen: úsalos y no los cambies salvo que una prueba lo exija (anótalo en DECISIONES).
Plan primero; al terminar /verificar y BITACORA.
```

**Agregado por pedido de Jacobo (D-048):** en `/ruta`, **Pegar lugares**: una línea por negocio, con enlace de Google Maps,
coordenadas o dirección (la dirección no se geocodifica: queda "Sin ubicar").
