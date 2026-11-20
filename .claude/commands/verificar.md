---
description: Revisa que la fase actual esté bien terminada antes de cerrarla
---

Corre y reporta en una tabla (comando · resultado · qué arreglaste):

1. `pnpm lint` y `pnpm typecheck` sin errores.
2. `pnpm test` (Vitest) en verde.
3. Pruebas de la base en verde: en Windows `powershell -ExecutionPolicy Bypass -File scripts/probar-sql.ps1`;
   en Linux/CI `bash scripts/probar-sql.sh`. Si ya hay pruebas pgTAP en `supabase/tests/`, también `pnpm exec supabase test db`.
4. `pnpm e2e` (Playwright, móvil 390×844) en verde; guarda capturas en `tests/capturas/`.
5. Seguridad (docs/SEGURIDAD.md):
   - toda tabla de `public` tiene RLS activo (consulta `pg_tables` + `relrowsecurity`);
   - `anon` no tiene permisos sobre tablas, vistas ni funciones de `public`, comprobado **contra la base de
     `supabase start`** (allá sí existen los permisos por defecto de Supabase);
   - no hay llaves ni `service_role` en el código (`git grep -n "service_role\|eyJhbGci"`);
   - `pnpm audit --audit-level high` sin hallazgos.
6. Tutorial guiado: cada pantalla nueva de la fase tiene sus pasos del recorrido y sus tooltips (docs/DESIGN.md).
7. Reglas de CLAUDE.md: ningún `float`/decimal para dinero, ningún `insert` en `comisiones` desde la app,
   ningún `delete` de filas de negocio desde la app.
8. Criterios de la fase en `docs/PLAN.md`: marca cada uno como cumplido o explica por qué no.

Si algo falla, arréglalo y vuelve a correr todo. No cierres la fase con algo en rojo.
