# Portal Mamut — reglas para Claude Code

Portal de administración gerencial de **Mamut Herd**: clientes por producto, ventas en curso,
cobros y mensualidades, equipo y tareas, comisiones, inventario de tags NFC y metas.
Primero lo usa Mamut; en la fase 5 se vuelve producto para otros gerentes.
Es un producto **aparte de Tino** pero con **la misma base técnica** (empresas, usuarios, RLS, pesos enteros,
borrado lógico). La estética es la de **Mamut Herd**, no la de Tino. Por qué: `docs/DECISIONES.md` → D-001 y D-011.
Se usa igual en celular y en PC, y enseña a usarse sola con un tutorial guiado.

Antes de cualquier tarea lee: este archivo, `docs/VISION.md`, `docs/ARQUITECTURA.md`,
`docs/MODELO-DATOS.md`, `docs/DESIGN.md`, `docs/SEGURIDAD.md` y la fase que toca en `docs/PLAN.md`.

## Cómo trabajas

- Trabaja solo dentro de la fase pedida. No adelantes fases.
- Muestra el plan antes de escribir código. Al terminar: corre `/verificar`, escribe la entrada
  en `docs/BITACORA.md` y di qué quedó, qué debe probar Jacobo y qué quedó sin hacer.
- Si tomas una decisión que no está escrita, anótala en `docs/DECISIONES.md` (D-0XX) y sigue.
  Pregunta solo si la decisión es difícil de deshacer (borrar datos, cambiar el modelo de dinero, seguridad).
- Jacobo trabaja en **Windows con PowerShell**. Los comandos que le pidas correr, escríbelos para PowerShell.
- Cada pantalla nueva llega con su parte del **tutorial guiado** (docs/DESIGN.md → "Tutorial guiado").
- Jacobo trabaja como "vibe engineer": quiere entender lo que haces. Explica en español simple,
  sin jerga innecesaria, qué cambiaste y por qué.

## Stack (no cambiarlo sin una decisión escrita)

- **Next.js** (App Router) + **TypeScript** estricto, desplegado en **Vercel**.
- **Supabase**: Postgres + Auth + RLS. Migraciones en `supabase/migrations/`, con el CLI de Supabase.
- **Tailwind CSS** con los tokens de Mamut de `docs/DESIGN.md` (salen del kit de marca en `docs/mamut-herd/`). Íconos **Lucide**. Validación con **Zod**.
- Pruebas: **Vitest** (lógica), **Playwright** (móvil 390×844 y PC 1280×800), pruebas de la base con
  `scripts/probar-sql.ps1` en Windows o `scripts/probar-sql.sh` en Linux/CI, y pgTAP en `supabase/tests/`
  cuando se agreguen.
- pnpm. Nada de librerías pesadas de UI; componentes propios y simples.

## Reglas que nunca se rompen

1. **Todo dato vive dentro de una empresa** (`empresa_id`) y toda tabla tiene RLS. El cliente web
   usa solo la llave `anon` + la sesión del usuario. La `service_role` nunca llega al navegador.
2. **Dinero = pesos enteros** (`int`). Nada de decimales ni `float`. Se muestra con
   `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
3. **Nadie cobra sobre plata que no entró:** las comisiones las crea la base de datos cuando se
   registra un pago (trigger `generar_comisiones`). La app nunca calcula ni inserta comisiones a mano.
4. **Borrado lógico:** se llena `borrado_en` (o `anulado_en` en cobros y pagos). No se borran filas
   de negocio desde la app.
5. **Fechas de negocio en hora de Bogotá** (`America/Bogota`). Semanas de lunes a domingo.
6. **Una ayudante solo ve lo suyo:** sus clientes, oportunidades, actividades, tareas y comisiones.
   Nunca cobros, pagos ni lo que ganan otros. Lo garantiza RLS; la interfaz solo lo refleja.
7. **Datos personales (Ley 1581 de 2012):** contactos de clientes solo para la gestión comercial;
   no se exportan sin que lo pida un gerente.
8. Las migraciones se pueden correr dos veces sin error (`if not exists`, `create or replace`).

## Estilo

- Interfaz en **español de Colombia**, tuteo, frases cortas. Ejemplo: "Anota la visita", no "Registrar actividad".
- **Móvil primero:** lo que se usa en la calle (anotar visita, ver mi día) se hace con una mano.
- Código en español para el dominio (tablas, columnas, tipos): `cliente`, `oportunidad`, `cobro`.
  Inglés solo en lo genérico de React/Next.
- Animaciones cortas (150–250 ms), solo `transform` y `opacity`, y respetar `prefers-reduced-motion`.

## Mapa

```
app/                 Rutas (App Router). (gerente)/ y (ayudante)/ como grupos.
components/          Componentes propios (ver docs/DESIGN.md), incluido el del tutorial guiado
lib/supabase/        Clientes de Supabase (server y browser) y tipos generados
lib/dominio/         Reglas puras y testeables (formatos, semanas, etapas, extractos)
lib/recorridos.ts    Todos los pasos del tutorial guiado
public/marca/        Logos de Mamut copiados de docs/mamut-herd/ (Fase 0)
supabase/migrations/ Esquema (20261120000000_base.sql y 20261120000100_permisos_por_defecto.sql)
supabase/seed.sql    Mamut Herd con productos, planes, comisiones, inventario y metas
supabase/pruebas/    Pruebas de la base (base_test.sql) y el stub para Postgres sin Supabase
supabase/tests/      Solo pgTAP (lo corre `supabase test db`); vacía al inicio
scripts/             probar-sql.sh (Linux/CI) y probar-sql.ps1 (Windows, con Docker)
docs/                Visión, arquitectura, modelo, diseño, plan, seguridad, decisiones, bitácora
docs/mamut-herd/     Kit de marca de Mamut Herd: no se modifica
SEGUIMIENTO.md       Tablero de Jacobo: en qué fase va y qué sigue
```
