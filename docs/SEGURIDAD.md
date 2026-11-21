# Seguridad

## Llaves y secretos

- En el navegador solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` **no se usa** en la app en las fases 0–4b. Si una tarea parece necesitarla, para y anótalo.
  Única excepción (D-016): el setup de Playwright en local y en CI puede usar la llave `service_role` **local**
  de `supabase start` para crear el usuario de prueba. Nunca la de la nube.
- `.env.local` nunca se sube a git (`.gitignore` desde la fase 0). Variables de producción solo en Vercel.

## RLS (la seguridad real está en la base)

- Todas las tablas tienen RLS. `anon` no tiene permisos sobre ninguna tabla.
- `es_gerente(empresa)`: todo dentro de su empresa.
- Ayudante: lee catálogo, equipo y reglas de comisión; lee y crea sus clientes, oportunidades y actividades;
  lee sus comisiones, tareas y metas. **No ve** cobros, pagos, suscripciones, inventario ni comisiones de otros.
- Ayudante no puede marcar una oportunidad `ganada` ni cambiar el valor o el pago de sus tareas.
- Las vistas usan `security_invoker = true`.
- Toda tabla nueva: RLS + política de gerente + prueba en `supabase/pruebas/base_test.sql` (o pgTAP en
  `supabase/tests/`) antes de usarla en la app.

## Permisos por defecto de Supabase (D-012)

- Supabase les da permisos a `anon` sobre lo nuevo que se crea en `public`. La migración
  `20261120000100_permisos_por_defecto.sql` los quita para todo lo que se cree después.
- Igual, cada función nueva lleva su `revoke execute … from public, anon;` explícito y, si es
  `security definer`, valida `auth.uid()` y el rol adentro.

## Contraseñas e invitaciones (D-014)

- Todos entran con correo y contraseña (mínimo 8 caracteres). "Olvidé mi contraseña" usa el correo de Supabase.
- En Supabase → Authentication → URL Configuration: **Site URL** = la URL de Vercel, y en **Redirect URLs**
  esa URL más `/entrar/nueva-clave`, `/unirme` y `/registro`. Sin esto, los correos llevan a `localhost`.
- Invitaciones (fase 3): token aleatorio de un solo uso que vence en 7 días; en la base se guarda solo su hash.
  Se manda por WhatsApp; no se necesita `service_role`.

## Server Actions

- Validar todo con Zod. `empresa_id` sale de la sesión en el servidor, nunca del formulario.
- Comprobar el rol en el servidor además de RLS (doble barrera) en acciones de gerente.
- Errores al usuario en lenguaje simple; el detalle técnico solo en el log del servidor.

## Datos personales (Ley 1581 de 2012)

- Los contactos de los negocios (nombre del dueño, WhatsApp) se usan solo para la gestión comercial de Mamut.
- Exportar a CSV: solo gerente, y queda anotado en la bitácora de la app (fase 5).
- Al llegar a la fase 5 (otras empresas): política de tratamiento de datos y términos revisados por un abogado.

## Revisión antes de cada fase

`/verificar` incluye: RLS activo en toda tabla, `anon` sin permisos, sin llaves en el código,
`pnpm audit` sin vulnerabilidades altas y pruebas de base en verde.
