# Arquitectura

## Piezas

```
Celular y PC (una sola app responsive; PWA instalable)
   │  Next.js en Vercel: Server Components + Server Actions
   │  sesión de Supabase Auth en cookies (@supabase/ssr), llave anon
   ▼
Supabase: local con Docker para desarrollar y probar + un proyecto en la nube `mamut-portal` (D-013)
   ├─ Postgres con RLS en todas las tablas (supabase/migrations)
   ├─ Triggers: comisiones al registrar pagos, protección de tareas
   ├─ Funciones: generar_mensualidades(empresa, mes); anotar_visita (fase 1); aceptar_invitacion (fase 3)
   └─ Auth: correo + contraseña para todos; ayudantes entran por invitación y crean su contraseña (D-014)
```

- **Lecturas** en Server Components con el cliente de servidor (respeta RLS por la sesión).
- **Escrituras** con Server Actions + Zod. Nunca se confía en lo que manda el navegador:
  `empresa_id` se toma de la empresa activa del usuario en el servidor, no de un campo oculto.
- **Sin APIs públicas** en las fases 1–4.
- **Tipos** generados con `supabase gen types typescript` en `lib/supabase/tipos.ts` después de cada migración.

## Misma base que Tino (D-001)

Portal y Tino comparten **convenciones y forma del esquema**, no la misma base de datos todavía:

| Se comparte | Cómo |
| --- | --- |
| `empresas` y `miembros` (roles) | Misma forma de tablas y de las funciones `es_miembro`, `es_gerente`, `mi_miembro` |
| Reglas | Dinero en pesos enteros, borrado lógico, RLS por `empresa_id`, hora de Bogotá |
| Diseño | **No se comparte**: el portal usa la estética de Mamut Herd (D-011) |
| Login | Supabase Auth en ambos |

Cuando un cliente compre los dos (fase 5 o después), se unen en **un solo proyecto de Supabase**
con esquemas separados (`portal`, `tino`) y las tablas `empresas`/`miembros` compartidas en `public`.
Por eso los nombres de tablas no chocan con los de Tino y todo cuelga de `empresa_id`.

## Relación con Nef

Nef tiene su propio Supabase y su `/admin` (negocios, tags, estadísticas). En las fases 1–4
el portal **no** se conecta a Nef: el negocio se crea en ambos lados a mano y los tags se cuentan
en el inventario del portal. Fase 5 (opcional): una vista de solo lectura o un webhook para traer
toques y tags asignados (ver D-007).

## Rutas (propuesta, la fase decide el detalle)

| Ruta | Quién | Qué |
| --- | --- | --- |
| `/entrar` | todos | Correo y contraseña; "Olvidé mi contraseña" → `/entrar/nueva-clave` |
| `/unirme?token=…` | ayudante invitada | Crea su cuenta con su contraseña (fase 3) |
| `/guia` | todos | Los 5 pasos y "Hacer el recorrido otra vez" |
| `/semana` | gerente | Resumen del domingo (fase 4) |
| `/hoy` | todos | Mi día: seguimientos vencidos y de hoy, tareas, meta de la semana, botón grande "Anotar visita" |
| `/clientes`, `/clientes/[id]` | gerente; ayudante (los suyos) | Ficha: datos, oportunidades, actividades, cobros (solo gerente) |
| `/ventas` | gerente; ayudante (las suyas) | Oportunidades por etapa, filtro por producto y vendedor |
| `/cobros` | gerente | Por cobrar, vencidos, pagos recientes; botón "Registrar pago"; "Generar mensualidades del mes" |
| `/equipo`, `/equipo/[id]` | gerente | Ayudantes, forma de pago, tareas, comisiones y trabajos por pagar |
| `/mis-comisiones` | ayudante | Lo que ganó, lo pendiente y lo pagado |
| `/tareas` | gerente; ayudante (las suyas) | Lista con vencimiento |
| `/inventario` | gerente | Stock, alertas de stock bajo, movimientos |
| `/metas` | gerente; ayudante (las suyas y de la empresa) | Semana actual y anteriores, avance contra objetivo |
| `/ajustes` | gerente | Productos, planes y precios, reglas de comisión, empresa |

## Carpetas

```
app/(publico)/entrar  entrar/nueva-clave  unirme
app/(app)/layout.tsx          barra inferior en móvil, lateral en escritorio
app/(app)/hoy  clientes  ventas  cobros  equipo  mis-comisiones  tareas  inventario  metas  semana  guia  ajustes
components/ui                 Boton, Campo, Hoja (bottom sheet), Chip, Tarjeta, Dinero, Vacio
components/dominio            FichaCliente, TarjetaOportunidad, FormVisita, BarraMeta…
components/recorrido          Tutorial guiado: coach marks, tooltips, hotspots
lib/supabase                  server.ts, browser.ts, tipos.ts
lib/dominio                   dinero.ts, semanas.ts, etapas.ts, whatsapp.ts, extractos/ (+ pruebas Vitest)
lib/recorridos.ts             Pasos de todos los recorridos, por rol
```

## WhatsApp

Sin API de WhatsApp (D-006). Los recordatorios de cobro y los seguimientos abren
`https://wa.me/57XXXXXXXXXX?text=...` con el mensaje ya escrito. Plantillas en `lib/dominio/whatsapp.ts`.

## Mapa (fase 1b)

| Pieza | Qué se usa | Costo |
| --- | --- | --- |
| Pintar el mapa | `maplibre-gl` + estilos de OpenFreeMap (`https://tiles.openfreemap.org/styles/positron` y `/dark`) | $0, sin llave ni registro |
| Orden de las paradas | `lib/dominio/ruta.ts` en el navegador (vecino más cercano + 2-opt) | $0, sin red |
| Línea por las calles | openrouteservice `POST /v2/directions/foot-walking/geojson`, desde una Server Action | $0 con la llave gratis (2.000 rutas al día) |
| Navegar | Enlaces de Google Maps (`/maps/dir/?api=1`): "Ir" a la siguiente o la ruta en tramos | $0, sin llave |
| Ubicar negocios | GPS del celular al anotar la visita, pin en el mapa o enlace pegado | $0 |

- **Carga:** el componente del mapa es de cliente (`'use client'`) y se importa con `next/dynamic` (`ssr: false`).
  Así los ~275 KB comprimidos de MapLibre solo bajan en `/ruta` y en la vista de mapa de `/ventas`.
- **openrouteservice:** la llave va en `ORS_API_KEY` (solo servidor, nunca `NEXT_PUBLIC_`). Máximo una llamada por
  cambio de orden o de paradas; el resultado se guarda en `rutas.geometria`. Coordenadas en orden `[lng, lat]`.
  Si responde error, la app pinta líneas rectas y muestra "Línea aproximada" con `estimarCaminata`.
- **Enlaces cortos** (`maps.app.goo.gl`): una Server Action los sigue con `fetch(url, { redirect: 'manual' })`
  y lee `Location`, hasta 3 saltos, **solo** para los hosts `maps.app.goo.gl`, `goo.gl`, `maps.google.com` y
  `www.google.com` (para que no se pueda usar el servidor para pedir otras páginas). Luego `leerEnlaceMaps`.
- **Sin geocodificar direcciones** en esta fase: las direcciones de Bogotá ("Cra 13 # 45-20") se resuelven mal con los
  servicios gratis. Lo confiable es el GPS estando en el negocio.
- **Ubicación del celular:** `navigator.geolocation` funciona solo con HTTPS (Vercel) o `localhost`. Si la persona no
  da permiso, la ruta se ordena desde la primera parada y el botón "Ir" deja que Google Maps use su ubicación.
