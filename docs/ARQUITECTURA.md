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
