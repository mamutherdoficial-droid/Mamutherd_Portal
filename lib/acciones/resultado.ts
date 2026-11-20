// Respuesta común de las acciones del servidor: o salió bien, o un error que dice qué hacer.
export type Resultado<T = undefined> = { ok: true; datos?: T; mensaje?: string } | { ok: false; error: string };

export function fallo(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** Traduce errores de Postgres/Supabase a frases para la persona; el detalle va al log. */
export function errorAmable(contexto: string, e: { code?: string; message?: string } | null | undefined): string {
  console.error(`[${contexto}]`, e?.code, e?.message);
  if (!e) return "Algo salió mal. Vuelve a intentar.";
  if (e.code === "42501") return "No tienes permiso para hacer eso.";
  if (e.code === "22023" && e.message) return e.message; // mensajes propios de las funciones SQL
  if (e.code === "23514") return "Falta un dato obligatorio. Revisa el formulario.";
  return "No pudimos guardar. Revisa tu conexión y vuelve a intentar.";
}
