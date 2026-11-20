-- =====================================================================
-- Permisos por defecto (D-012)
-- Supabase da por defecto permisos a anon sobre las tablas, secuencias y
-- funciones nuevas de public. Aquí se quitan para todo lo que se cree desde
-- ahora y para las funciones que ya existen. authenticated sigue pasando por RLS.
-- Se puede correr dos veces sin error.
-- =====================================================================
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
revoke execute on all functions in schema public from anon;
